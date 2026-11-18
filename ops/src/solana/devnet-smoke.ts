import { SolanaPegloClient } from '@peglo/sdk/solana'
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
import { connect, loadKeypair, readDeployment, signerOf } from './common.js'

const conn = connect('devnet')
const d = readDeployment('devnet')!
const client = new SolanaPegloClient(conn, d)
const admin = loadKeypair()
const sym = (s: string) => client.tokens.find((t) => t.symbol === s)!
const usd = (n: number) => BigInt(n) * 10n ** 18n
let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}
const fmt = (v: bigint, dec: number) => (Number(v) / 10 ** dec).toFixed(4)

async function fund(kp: Keypair, sol: number) {
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: kp.publicKey, lamports: Math.round(sol * LAMPORTS_PER_SOL) }))
  await sendAndConfirmTransaction(conn, tx, [admin], { commitment: 'confirmed' })
}
async function refund(kp: Keypair) {
  const bal = await conn.getBalance(kp.publicKey, 'confirmed')
  if (bal <= 5000) return
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: admin.publicKey, lamports: bal - 5000 }))
  await sendAndConfirmTransaction(conn, tx, [kp], { commitment: 'confirmed' })
}

const lp = Keypair.generate()
const taker = Keypair.generate()
console.log(`LP ${lp.publicKey.toBase58()}\ntaker ${taker.publicKey.toBase58()}`)
await fund(lp, 0.08)
await fund(taker, 0.03)

await client.faucet(signerOf(lp), 1000)
await client.faucet(signerOf(taker), 1000)
const usdc = sym('USDC')
const eurc = sym('EURC')
const iU = client.tokens.indexOf(usdc)
const iE = client.tokens.indexOf(eurc)
const lp0 = await client.balancesOf(lp.publicKey)
const tk0 = await client.balancesOf(taker.publicKey)
check('faucet gave test coins', lp0[iU]! > 0n && tk0[iU]! > 0n, `LP USDC ${fmt(lp0[iU]!, usdc.decimals)}`)

const config = client.buildRange('balanced', usd(200))
await client.ship(signerOf(lp), config, usd(200))
const mine = (await client.listRanges()).filter((r) => r.maker.toLowerCase() === lp.publicKey.toBase58().toLowerCase())
check('LP opened a Balanced range', mine.length === 1, mine[0]?.id)
const lpAfterOpen = await client.balancesOf(lp.publicKey)
check('coins stayed in the LP wallet after opening', lpAfterOpen[iU] === lp0[iU] && lpAfterOpen[iE] === lp0[iE])

const market = await client.market()
const only = { ...market, ranges: market.ranges.filter((r) => r.id === mine[0]!.id), backstops: [] }
const amountIn = 50n * 10n ** BigInt(usdc.decimals)
const quote = client.quoteExactIn(only, usdc.address, eurc.address, amountIn)
check('quote 50 USDC to EURC', quote.amountOut > 0n && quote.filled === amountIn, `${fmt(quote.amountOut, eurc.decimals)} EURC`)
await client.swap(signerOf(taker), quote, 30)
const tk1 = await client.balancesOf(taker.publicKey)
const got = tk1[iE]! - tk0[iE]!
check('taker paid exactly 50 USDC', tk0[iU]! - tk1[iU]! === amountIn)
check('taker received the quoted EURC', got >= quote.amountOut, `${fmt(got, eurc.decimals)} EURC`)
const lp1 = await client.balancesOf(lp.publicKey)
check('USDC landed in the LP wallet', lp1[iU]! - lpAfterOpen[iU]! === amountIn)
check('EURC was paid from the LP wallet', lpAfterOpen[iE]! - lp1[iE]! === got)

await client.dock(signerOf(lp), mine[0]!)
const left = (await client.listRanges()).filter((r) => r.id === mine[0]!.id)
check('LP closed the range', left.length === 0)

await refund(lp)
await refund(taker)
console.log(failures ? `${failures} FAILED` : 'ALL PASSED')
process.exit(failures ? 1 : 0)
