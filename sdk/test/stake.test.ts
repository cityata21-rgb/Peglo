import { Keypair, type ParsedTransactionWithMeta } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { STAKE_TERMS, aprOf, parseLocks, payoutMemo, rewardOf, stakeMemo, termOf } from '../src/solana/index.js'

const vault = Keypair.generate().publicKey
const user = Keypair.generate().publicKey.toBase58()
const userAta = Keypair.generate().publicKey.toBase58()

function tx(memo: string, t: { source: string; destination: string; authority: string; amount: bigint }, blockTime = 1_000_000, err: unknown = null) {
  return {
    blockTime,
    meta: { err, innerInstructions: [] },
    transaction: {
      message: {
        instructions: [
          { program: 'spl-token', programId: vault, parsed: { type: 'transferChecked', info: { ...t, tokenAmount: { amount: t.amount.toString() } } } },
          { program: 'spl-memo', programId: vault, parsed: memo },
        ],
      },
    },
  } as unknown as ParsedTransactionWithMeta
}

const sig = (n: number) => `${'5'.repeat(40)}${n}`

describe('stake terms', () => {
  it('pays the term reward and reports an annual rate', () => {
    const t = termOf(30)!
    expect(rewardOf(1_000_000n, t)).toBe(15_000n)
    expect(aprOf(t)).toBeCloseTo(0.1825, 4)
    expect(termOf(31)).toBeNull()
    expect(STAKE_TERMS.every((x) => x.rewardBps > 0 && x.days > 0)).toBe(true)
  })
})

describe('parseLocks', () => {
  const v = vault.toBase58()
  it('reads a stake and matches its payout', () => {
    const locks = parseLocks(vault, [
      { signature: sig(1), tx: tx(stakeMemo(30), { source: userAta, destination: v, authority: user, amount: 1_000_000n }) },
      { signature: sig(2), tx: tx(payoutMemo(sig(1)), { source: v, destination: userAta, authority: 'team', amount: 1_015_000n }, 1_000_000 + 30 * 86_400) },
    ])
    expect(locks).toHaveLength(1)
    expect(locks[0]).toMatchObject({ owner: user, amount: 1_000_000n, reward: 15_000n, days: 30, unlock: 1_000_000 + 30 * 86_400, payout: sig(2) })
  })

  it('ignores unknown terms, failed transactions and transfers to other accounts', () => {
    const locks = parseLocks(vault, [
      { signature: sig(3), tx: tx(stakeMemo(31), { source: userAta, destination: v, authority: user, amount: 5n }) },
      { signature: sig(4), tx: tx(stakeMemo(7), { source: userAta, destination: v, authority: user, amount: 5n }, 1, { err: 1 }) },
      { signature: sig(5), tx: tx(stakeMemo(7), { source: userAta, destination: userAta, authority: user, amount: 5n }) },
      { signature: sig(6), tx: tx('hello', { source: userAta, destination: v, authority: user, amount: 5n }) },
    ])
    expect(locks).toHaveLength(0)
  })

  it('does not count a payout that did not come from the vault', () => {
    const locks = parseLocks(vault, [
      { signature: sig(7), tx: tx(stakeMemo(7), { source: userAta, destination: v, authority: user, amount: 100n }) },
      { signature: sig(8), tx: tx(payoutMemo(sig(7)), { source: userAta, destination: v, authority: user, amount: 1n }) },
    ])
    expect(locks[0]!.payout).toBeNull()
  })
})
