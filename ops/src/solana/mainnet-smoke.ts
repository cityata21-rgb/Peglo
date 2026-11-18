import { existsSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { SolanaPegloClient } from '@peglo/sdk/solana'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { connect, loadKeypair, readDeployment, signerOf } from './common.js'

const send = process.argv.includes('--send')
const conn = connect('mainnet')
const d = readDeployment('mainnet')!
const client = new SolanaPegloClient(conn, d)
const lp = loadKeypair()
const takerPath = join(homedir(), '.config', 'solana', 'peglo-test-taker.json')
if (!existsSync(takerPath)) writeFileSync(takerPath, JSON.stringify([...Keypair.generate().secretKey]), { mode: 0o600 })
const taker = loadKeypair(takerPath)
const sym = (s: string) => client.tokens.find((t) => t.symbol === s)!
const usdc = sym('USDC')
const usdt = sym('USDT')
const mU = new PublicKey(usdc.address)
const mT = new PublicKey(usdt.address)
const ata = (owner: PublicKey, mint: PublicKey) => getAssociatedTokenAddressSync(mint, owner, true)
const RANGE_USD = 1
const TO_TAKER = 400_000n
const SWAP_IN = 300_000n
let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}
const amt = async (owner: PublicKey, mint: PublicKey) => {
  try {
    return BigInt((await conn.getTokenAccountBalance(ata(owner, mint), 'confirmed')).value.amount)
  } catch {
    return 0n
  }
}
const f6 = (v: bigint) => (Number(v) / 1e6).toFixed(6)
const tx = (...ixs: Parameters<Transaction['add']>) => new Transaction().add(...ixs)

const sol = (await conn.getBalance(lp.publicKey, 'confirmed')) / LAMPORTS_PER_SOL
const lpU = await amt(lp.publicKey, mU)
const lpT = await amt(lp.publicKey, mT)
console.log(`LP ${lp.publicKey.toBase58()}: ${sol} SOL, ${f6(lpU)} USDC, ${f6(lpT)} USDT`)
console.log(`taker ${taker.publicKey.toBase58()} (key at ${takerPath})`)
const resume = (await amt(taker.publicKey, mU)) >= TO_TAKER
const ready = resume ? sol >= 0.004 && lpU >= 1_000_000n && lpT >= 1_000_000n : sol >= 0.015 && lpU >= 1_000_000n + TO_TAKER && lpT >= 1_000_000n
console.log(ready ? `funds are enough for the test${resume ? ' (resuming, taker already funded)' : ''}` : 'not enough yet: need 0.015 SOL, 1.4 USDC, 1 USDT in the LP wallet')
if (!send || !ready) process.exit(ready ? 0 : 2)

if (!resume) await sendAndConfirmTransaction(conn, tx(
  SystemProgram.transfer({ fromPubkey: lp.publicKey, toPubkey: taker.publicKey, lamports: 0.0065 * LAMPORTS_PER_SOL }),
  createAssociatedTokenAccountIdempotentInstruction(lp.publicKey, ata(taker.publicKey, mU), taker.publicKey, mU),
  createTransferCheckedInstruction(ata(lp.publicKey, mU), mU, ata(taker.publicKey, mU), lp.publicKey, TO_TAKER, 6),
), [lp], { commitment: 'confirmed' })
check('taker funded with 0.4 USDC', (await amt(taker.publicKey, mU)) === TO_TAKER)

const before = { lpU: await amt(lp.publicKey, mU), lpT: await amt(lp.publicKey, mT), tkU: await amt(taker.publicKey, mU), tkT: await amt(taker.publicKey, mT) }
const config = client.buildRange('balanced', BigInt(RANGE_USD) * 10n ** 18n, { tokens: [usdc.address, usdt.address] })
const existing = (await client.listRanges()).filter((r) => r.maker.toLowerCase() === lp.publicKey.toBase58().toLowerCase())
if (!existing.length) {
  const opened = await client.ship(signerOf(lp), config, BigInt(RANGE_USD) * 10n ** 18n)
  console.log(`  open ${opened.hash}`)
} else console.log(`  reusing open range ${existing[0]!.id}`)
const mine = (await client.listRanges()).filter((r) => r.maker.toLowerCase() === lp.publicKey.toBase58().toLowerCase())
check('LP opened a USDC/USDT range on mainnet', mine.length >= 1, mine[0]?.id)
check('coins stayed in the LP wallet', (await amt(lp.publicKey, mU)) === before.lpU && (await amt(lp.publicKey, mT)) === before.lpT)

try {
  const market = await client.market()
  const only = { ...market, ranges: market.ranges.filter((r) => r.id === mine[0]!.id), backstops: [] }
  const quote = client.quoteExactIn(only, usdc.address, usdt.address, SWAP_IN)
  check('quote 0.30 USDC to USDT', quote.filled === SWAP_IN && quote.amountOut > 0n, `${f6(quote.amountOut)} USDT`)
  const swapped = await client.swap(signerOf(taker), quote, 50)
  console.log(`  swap ${swapped.hash}`)
  const tkU = await amt(taker.publicKey, mU)
  const tkT = await amt(taker.publicKey, mT)
  const lpU1 = await amt(lp.publicKey, mU)
  const lpT1 = await amt(lp.publicKey, mT)
  check('taker paid exactly 0.30 USDC', before.tkU - tkU === SWAP_IN)
  check('taker received at least the quote', tkT - before.tkT >= quote.amountOut, `${f6(tkT - before.tkT)} USDT`)
  check('USDC landed in the LP wallet', lpU1 - before.lpU === SWAP_IN)
  check('USDT was paid from the LP wallet', before.lpT - lpT1 === tkT - before.tkT)
} finally {
  for (const r of mine) {
    const closed = await client.dock(signerOf(lp), r)
    console.log(`  close ${closed.hash}`)
  }
  check('range closed', (await client.listRanges()).every((r) => !mine.some((m) => m.id === r.id)))
  const back: Parameters<Transaction['add']> = []
  for (const mint of [mU, mT]) {
    const have = await amt(taker.publicKey, mint)
    const exists = await conn.getAccountInfo(ata(taker.publicKey, mint), 'confirmed')
    if (!exists) continue
    back.push(createAssociatedTokenAccountIdempotentInstruction(taker.publicKey, ata(lp.publicKey, mint), lp.publicKey, mint))
    if (have > 0n) back.push(createTransferCheckedInstruction(ata(taker.publicKey, mint), mint, ata(lp.publicKey, mint), taker.publicKey, have, 6))
    back.push(createCloseAccountInstruction(ata(taker.publicKey, mint), lp.publicKey, taker.publicKey))
  }
  if (back.length) await sendAndConfirmTransaction(conn, tx(...back), [taker], { commitment: 'confirmed' })
  const left = await conn.getBalance(taker.publicKey, 'confirmed')
  if (left > 0) await sendAndConfirmTransaction(conn, tx(SystemProgram.transfer({ fromPubkey: taker.publicKey, toPubkey: lp.publicKey, lamports: left - 5000 })), [taker], { commitment: 'confirmed' })
  const end = { sol: (await conn.getBalance(lp.publicKey, 'confirmed')) / LAMPORTS_PER_SOL, u: await amt(lp.publicKey, mU), t: await amt(lp.publicKey, mT) }
  console.log(`LP after: ${end.sol} SOL, ${f6(end.u)} USDC, ${f6(end.t)} USDT (started ${sol} SOL, ${f6(lpU)} USDC, ${f6(lpT)} USDT)`)
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED')
}
