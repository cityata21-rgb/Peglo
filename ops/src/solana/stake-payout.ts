import { homedir } from 'node:os'
import { join } from 'node:path'
import { type Lock, fetchStakeBook, payoutIxs, stakeToken } from '@peglo/sdk/solana'
import { PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { cluster, connect, loadKeypair } from './common.js'

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1]

const c = cluster()
const mintText = arg('mint') ?? process.env.PEGLO_MINT
if (!mintText) throw new Error('pass --mint=<token mint> or set PEGLO_MINT')
const kp = loadKeypair(arg('keypair') ?? process.env.STAKE_KEYPAIR ?? join(homedir(), '.config', 'solana', 'peglo-stake.json'))
const send = process.argv.includes('--send')
const loop = Number(arg('loop') ?? 0)
const conn = connect(c)
const cfg = { mint: new PublicKey(mintText), wallet: kp.publicKey }

async function round() {
  const token = await stakeToken(conn, cfg)
  const fmt = (v: bigint) => {
    const s = v.toString().padStart(token.decimals + 1, '0')
    return `${s.slice(0, -token.decimals)}.${s.slice(-token.decimals).slice(0, 2)}`
  }
  const book = await fetchStakeBook(conn, token, { limit: 1000 })
  const now = Math.floor(Date.now() / 1000)
  const due: Lock[] = book.locks.filter((l) => !l.payout && l.unlock <= now)
  console.log(`${new Date().toISOString()} staking wallet ${cfg.wallet.toBase58()} on ${c}`)
  console.log(`  vault ${fmt(book.vaultBalance)} · locked ${fmt(book.locked)} · rewards owed ${fmt(book.owed)} · pool left ${fmt(book.poolLeft)}`)
  console.log(`  ${book.locks.length} locks, ${due.length} due now`)
  for (const l of due) console.log(`  due ${l.owner} ${fmt(l.amount + l.reward)} for stake ${l.signature}`)

  const needed = due.reduce((s, l) => s + l.amount + l.reward, 0n)
  if (needed > book.vaultBalance) {
    console.error(`  the vault holds ${fmt(book.vaultBalance)} but ${fmt(needed)} is due. Top it up, nothing was sent.`)
    return
  }
  if (!send) {
    if (due.length) console.log('  dry run, add --send to pay these')
    return
  }
  for (const l of due) {
    const sig = await sendAndConfirmTransaction(conn, new Transaction().add(...payoutIxs(cfg, token, l)), [kp], { commitment: 'confirmed' })
    console.log(`  paid ${l.owner} ${fmt(l.amount + l.reward)}: ${sig}`)
  }
}

await round()
while (loop > 0) {
  await new Promise((r) => setTimeout(r, loop * 1000))
  await round().catch((e) => console.error(`  round failed: ${(e as Error).message}`))
}
