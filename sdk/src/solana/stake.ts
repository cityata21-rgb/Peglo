import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import {
  type Connection,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
  PublicKey,
  type TransactionInstruction,
  TransactionInstruction as Ix,
} from '@solana/web3.js'

export const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

export interface StakeTerm {
  days: number
  rewardBps: number
}

export const STAKE_TERMS: readonly StakeTerm[] = [
  { days: 7, rewardBps: 20 },
  { days: 30, rewardBps: 150 },
  { days: 90, rewardBps: 600 },
  { days: 180, rewardBps: 1500 },
]

export const DAY_SECONDS = 86_400

export const termOf = (days: number) => STAKE_TERMS.find((t) => t.days === days) ?? null

export const aprOf = (t: StakeTerm) => (t.rewardBps / 10_000) * (365 / t.days)

export const rewardOf = (amount: bigint, t: StakeTerm) => (amount * BigInt(t.rewardBps)) / 10_000n

export const stakeMemo = (days: number) => `peglo:stake:${days}`

export const payoutMemo = (stakeSignature: string) => `peglo:payout:${stakeSignature}`

export interface StakeConfig {
  mint: PublicKey
  wallet: PublicKey
}

export interface StakeToken {
  program: PublicKey
  decimals: number
  vault: PublicKey
}

export interface Lock {
  signature: string
  owner: string
  amount: bigint
  days: number
  reward: bigint
  start: number
  unlock: number
  payout: string | null
}

export interface StakeBook {
  locks: Lock[]
  vaultBalance: bigint
  locked: bigint
  owed: bigint
  poolLeft: bigint
}

export function memoIx(text: string, signer: PublicKey): TransactionInstruction {
  return new Ix({ programId: MEMO_PROGRAM, keys: [{ pubkey: signer, isSigner: true, isWritable: false }], data: Buffer.from(text, 'utf8') })
}

export async function stakeToken(connection: Connection, cfg: StakeConfig): Promise<StakeToken> {
  const info = await connection.getAccountInfo(cfg.mint, 'confirmed')
  if (!info) throw new Error('Token mint not found on this cluster')
  const decimals = info.data[44]
  if (decimals === undefined) throw new Error('Not a token mint')
  return { program: info.owner, decimals, vault: getAssociatedTokenAddressSync(cfg.mint, cfg.wallet, true, info.owner) }
}

export const ataOf = (cfg: StakeConfig, token: StakeToken, owner: PublicKey) => getAssociatedTokenAddressSync(cfg.mint, owner, true, token.program)

export async function tokenBalance(connection: Connection, account: PublicKey): Promise<bigint> {
  try {
    const r = await connection.getTokenAccountBalance(account, 'confirmed')
    return BigInt(r.value.amount)
  } catch {
    return 0n
  }
}

export function stakeIxs(cfg: StakeConfig, token: StakeToken, owner: PublicKey, amount: bigint, days: number): TransactionInstruction[] {
  if (!termOf(days)) throw new Error(`No ${days}-day term`)
  if (amount <= 0n) throw new Error('Amount must be above zero')
  return [
    createAssociatedTokenAccountIdempotentInstruction(owner, token.vault, cfg.wallet, cfg.mint, token.program),
    createTransferCheckedInstruction(ataOf(cfg, token, owner), cfg.mint, token.vault, owner, amount, token.decimals, [], token.program),
    memoIx(stakeMemo(days), owner),
  ]
}

export function payoutIxs(cfg: StakeConfig, token: StakeToken, lock: Lock): TransactionInstruction[] {
  const owner = new PublicKey(lock.owner)
  const dest = ataOf(cfg, token, owner)
  return [
    createAssociatedTokenAccountIdempotentInstruction(cfg.wallet, dest, owner, cfg.mint, token.program),
    createTransferCheckedInstruction(token.vault, cfg.mint, dest, cfg.wallet, lock.amount + lock.reward, token.decimals, [], token.program),
    memoIx(payoutMemo(lock.signature), cfg.wallet),
  ]
}

interface Transfer {
  source: string
  destination: string
  authority: string
  amount: bigint
}

function parsedIxs(tx: ParsedTransactionWithMeta): ParsedInstruction[] {
  const top = tx.transaction.message.instructions
  const inner = (tx.meta?.innerInstructions ?? []).flatMap((i) => i.instructions)
  return [...top, ...inner].filter((i): i is ParsedInstruction => 'parsed' in i)
}

function memoText(tx: ParsedTransactionWithMeta): string | null {
  for (const i of parsedIxs(tx)) {
    if (i.program === 'spl-memo' && typeof i.parsed === 'string') return i.parsed
  }
  return null
}

function transfers(tx: ParsedTransactionWithMeta): Transfer[] {
  const out: Transfer[] = []
  for (const i of parsedIxs(tx)) {
    if (i.program !== 'spl-token' && i.program !== 'spl-token-2022') continue
    const p = i.parsed as { type?: string; info?: Record<string, unknown> }
    if (p.type !== 'transfer' && p.type !== 'transferChecked') continue
    const info = p.info ?? {}
    const raw = (info.tokenAmount as { amount?: string } | undefined)?.amount ?? (info.amount as string | undefined)
    if (!raw) continue
    out.push({
      source: String(info.source),
      destination: String(info.destination),
      authority: String(info.authority ?? info.multisigAuthority ?? ''),
      amount: BigInt(raw),
    })
  }
  return out
}

export function parseLocks(vault: PublicKey, txs: { signature: string; tx: ParsedTransactionWithMeta | null }[]): Lock[] {
  const v = vault.toBase58()
  const locks = new Map<string, Lock>()
  const payouts = new Map<string, string>()
  for (const { signature, tx } of txs) {
    if (!tx || tx.meta?.err) continue
    const memo = memoText(tx)
    if (!memo) continue
    const stake = /^peglo:stake:(\d+)$/.exec(memo)
    const payout = /^peglo:payout:([1-9A-HJ-NP-Za-km-z]{32,90})$/.exec(memo)
    if (stake) {
      const term = termOf(Number(stake[1]))
      const t = transfers(tx).find((x) => x.destination === v)
      if (!term || !t || t.amount <= 0n || tx.blockTime == null) continue
      locks.set(signature, {
        signature,
        owner: t.authority,
        amount: t.amount,
        days: term.days,
        reward: rewardOf(t.amount, term),
        start: tx.blockTime,
        unlock: tx.blockTime + term.days * DAY_SECONDS,
        payout: null,
      })
    } else if (payout && transfers(tx).some((x) => x.source === v)) {
      payouts.set(payout[1]!, signature)
    }
  }
  for (const [stakeSig, paySig] of payouts) {
    const l = locks.get(stakeSig)
    if (l) l.payout = paySig
  }
  return [...locks.values()].sort((a, b) => b.start - a.start)
}

export async function fetchStakeBook(connection: Connection, token: StakeToken, opts: { limit?: number } = {}): Promise<StakeBook> {
  const sigs = await connection.getSignaturesForAddress(token.vault, { limit: opts.limit ?? 500 }, 'confirmed')
  const ok = sigs.filter((s) => !s.err).map((s) => s.signature)
  const txs: { signature: string; tx: ParsedTransactionWithMeta | null }[] = []
  for (let k = 0; k < ok.length; k += 20) {
    const chunk = ok.slice(k, k + 20)
    const got = await connection.getParsedTransactions(chunk, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
    for (const tx of got) {
      const signature = tx?.transaction.signatures[0]
      if (tx && signature && chunk.includes(signature)) txs.push({ signature, tx })
    }
  }
  const locks = parseLocks(token.vault, txs)
  const vaultBalance = await tokenBalance(connection, token.vault)
  const open = locks.filter((l) => !l.payout)
  const locked = open.reduce((s, l) => s + l.amount, 0n)
  const owed = open.reduce((s, l) => s + l.reward, 0n)
  const left = vaultBalance - locked - owed
  return { locks, vaultBalance, locked, owed, poolLeft: left > 0n ? left : 0n }
}
