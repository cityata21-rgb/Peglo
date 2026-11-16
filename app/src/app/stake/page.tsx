'use client'

import {
  DAY_SECONDS,
  type Lock,
  STAKE_TERMS,
  type SolanaSigner,
  type StakeConfig,
  aprOf,
  ataOf,
  fetchStakeBook,
  rewardOf,
  stakeIxs,
  stakeToken,
  tokenBalance,
} from '@peglo/sdk/solana'
import { Connection, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TxStatus } from '@/components/tx-status'
import { Button, Label, Panel, Pill, SectionHead, Skeleton, Stat } from '@/components/ui'
import { formatAmount, shortAddress, toUnits } from '@/lib/format'
import { useNetwork, usePeglo } from '@/lib/peglo'
import { TOKEN, TOKEN_LIVE, dexEmbed, tokenLinks } from '@/lib/token'
import { useTx } from '@/lib/tx'

const MAINNET = 101
const pct = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 2 : 1).replace(/\.0+$/, '')}%`
const when = (t: number) => new Date(t * 1000).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function useMainnet() {
  return useMemo(() => (typeof window === 'undefined' ? null : new Connection(`${window.location.origin}/api/rpc?chain=101`, 'confirmed')), [])
}

function useDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const read = () =>
      setDark(
        document.documentElement.dataset.theme === 'dark' ||
          (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches),
      )
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function CopyAddress({ value }: { value: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 font-mono text-[12px] hover:bg-surface-hover"
      aria-label="Copy contract address"
    >
      <span className="truncate">{value}</span>
      {done ? <Check className="size-3.5 shrink-0" aria-hidden /> : <Copy className="size-3.5 shrink-0" aria-hidden />}
    </button>
  )
}

function ExtLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline decoration-line underline-offset-2 hover:decoration-ink">
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
    </a>
  )
}

function TermsTable({ amount, decimals }: { amount: bigint | null; decimals: number }) {
  return (
    <table className="mt-4 w-full text-left text-[13.5px]">
      <thead>
        <tr className="border-b border-line text-[10.5px] font-medium tracking-[0.08em] text-muted uppercase">
          <th className="py-2 font-medium">Term</th>
          <th className="py-2 font-medium">Reward</th>
          <th className="py-2 font-medium">Yearly rate</th>
          <th className="py-2 text-right font-medium">You get back</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {STAKE_TERMS.map((t) => (
          <tr key={t.days}>
            <td className="py-2.5">{t.days} days</td>
            <td className="num py-2.5">{pct(t.rewardBps / 10_000)}</td>
            <td className="num py-2.5 text-muted">{pct(aprOf(t))}</td>
            <td className="num py-2.5 text-right">{amount ? `${formatAmount(amount + rewardOf(amount, t), decimals)} ${TOKEN.ticker}` : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LockRow({ l, decimals, now }: { l: Lock; decimals: number; now: number }) {
  const status = l.payout ? 'Paid' : now >= l.unlock ? 'Due' : 'Locked'
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3">
      <span className="num text-[14px]">
        {formatAmount(l.amount, decimals)} {TOKEN.ticker} <span className="text-muted">· {l.days} days</span>
      </span>
      <span
        className={`justify-self-end rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
          status === 'Paid' ? 'border-up/50 text-up' : status === 'Due' ? 'border-ink' : 'border-line text-muted'
        }`}
      >
        {status}
      </span>
      <span className="text-[12.5px] text-muted">
        {shortAddress(l.owner)} · unlocks {when(l.unlock)} · +{formatAmount(l.reward, decimals)}
      </span>
      <span className="justify-self-end text-[12px]">
        <ExtLink href={`https://solscan.io/tx/${l.payout ?? l.signature}`}>{l.payout ? 'payout' : 'stake'}</ExtLink>
      </span>
    </li>
  )
}

function ComingSoon() {
  return (
    <div className="space-y-7">
      <Panel className="p-5 sm:p-7">
        <Label>Not live yet</Label>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">
          ${TOKEN.ticker} has not launched. When it does, this page shows the contract address, the live chart, and lets holders lock it for one of the terms
          below.
        </p>
      </Panel>
      <Panel className="p-5 sm:p-7">
        <Label>Terms</Label>
        <TermsTable amount={null} decimals={6} />
      </Panel>
    </div>
  )
}

export default function StakePage() {
  const { deployment, solana, signer, wallet } = usePeglo()
  const { select } = useNetwork()
  const conn = useMainnet()
  const dark = useDark()
  const tx = useTx()
  const [days, setDays] = useState(30)
  const [text, setText] = useState('')
  const now = Math.floor(Date.now() / 1000)

  const cfg: StakeConfig | null = TOKEN_LIVE ? { mint: TOKEN.mint!, wallet: TOKEN.stakeWallet! } : null
  const token = useQuery({ queryKey: ['stake-token'], enabled: !!cfg && !!conn, queryFn: () => stakeToken(conn!, cfg!), staleTime: Infinity })
  const book = useQuery({
    queryKey: ['stake-book'],
    enabled: !!token.data,
    queryFn: () => fetchStakeBook(conn!, token.data!),
    refetchInterval: 60_000,
  })
  const owner = signer?.kind === 'solana' ? new PublicKey(signer.address) : null
  const balance = useQuery({
    queryKey: ['stake-balance', owner?.toBase58()],
    enabled: !!token.data && !!owner,
    queryFn: () => tokenBalance(conn!, ataOf(cfg!, token.data!, owner!)),
    refetchInterval: 30_000,
  })

  if (!cfg) {
    return (
      <div className="space-y-10">
        <SectionHead title={`Stake $${TOKEN.ticker}`} aside={<p className="max-w-2xl text-[14px] leading-snug text-muted">Lock ${TOKEN.ticker} for a term and get it back with a reward.</p>} />
        <ComingSoon />
      </div>
    )
  }

  const mint = cfg.mint.toBase58()
  const links = tokenLinks(mint)
  const dec = token.data?.decimals ?? 6
  const term = STAKE_TERMS.find((t) => t.days === days)!
  const amount = toUnits(text, dec)
  const reward = amount ? rewardOf(amount, term) : 0n
  const b = book.data
  const mine = b && owner ? b.locks.filter((l) => l.owner === owner.toBase58()) : []
  const stakers = b ? new Set(b.locks.filter((l) => !l.payout).map((l) => l.owner)).size : 0
  const onMainnet = deployment.chainId === MAINNET

  let cta = `Lock for ${days} days`
  let blocked = false
  if (!onMainnet) [cta, blocked] = ['Switch to Solana mainnet', false]
  else if (!signer || !wallet) [cta, blocked] = ['Connect a Solana wallet', true]
  else if (!amount || amount <= 0n) [cta, blocked] = ['Enter an amount', true]
  else if (balance.data !== undefined && amount > balance.data) [cta, blocked] = [`Not enough ${TOKEN.ticker}`, true]
  else if (b && reward > b.poolLeft) [cta, blocked] = ['Reward pool is full for this amount', true]

  const submit = () => {
    if (!onMainnet) return select('solana-mainnet')
    if (!solana || !wallet || !owner || !amount || !token.data) return
    tx.run('Approve the lock in your wallet', async () => {
      const [sig] = await solana.send(wallet as SolanaSigner, [stakeIxs(cfg, token.data!, owner, amount, days)])
      setText('')
      return { message: `Locked ${formatAmount(amount, dec)} ${TOKEN.ticker} for ${days} days.`, hash: sig }
    })
  }

  const setShare = (share: bigint) => balance.data !== undefined && setText(formatAmount((balance.data * share) / 100n, dec, dec).replace(/,/g, ''))

  return (
    <div className="space-y-10">
      <SectionHead
        title={`Stake $${TOKEN.ticker}`}
        aside={
          <p className="max-w-2xl text-[14px] leading-snug text-muted">
            Lock ${TOKEN.ticker} for a term. After the unlock date the team sends back your tokens plus the reward. Every lock and every payout is on chain below.
          </p>
        }
      />

      <Panel className="grid grid-cols-2 gap-6 p-5 sm:p-7 lg:grid-cols-4">
        <Stat label="Locked by everyone" value={b ? `${formatAmount(b.locked, dec, 0)}` : '…'} />
        <Stat label="Rewards owed" value={b ? `${formatAmount(b.owed, dec, 0)}` : '…'} />
        <Stat label="Reward pool left" value={b ? `${formatAmount(b.poolLeft, dec, 0)}` : '…'} />
        <Stat label="Stakers" value={b ? String(stakers) : '…'} />
      </Panel>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        <div className="space-y-7 lg:col-span-7">
          <Panel className="p-5 sm:p-7">
            <Label>Term</Label>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Lock term">
              {STAKE_TERMS.map((t) => (
                <button
                  key={t.days}
                  type="button"
                  role="radio"
                  aria-checked={t.days === days}
                  onClick={() => setDays(t.days)}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${t.days === days ? 'border-ink bg-paper' : 'border-line hover:bg-surface-hover'}`}
                >
                  <span className="block text-[12px] font-medium tracking-[0.08em] uppercase">{t.days} days</span>
                  <span className="num mt-1 block text-[20px]">+{pct(t.rewardBps / 10_000)}</span>
                  <span className="num block text-[12px] text-muted">{pct(aprOf(t))} a year</span>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-line bg-paper p-4">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="stake-amount" className="text-[10.5px] font-medium tracking-[0.08em] uppercase">
                  Amount
                </label>
                <span className="num text-[12px] text-muted">
                  Balance {balance.data !== undefined ? formatAmount(balance.data, dec) : '-'} {TOKEN.ticker}
                </span>
              </div>
              <input
                id="stake-amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={text}
                onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
                className="num mt-2 w-full bg-transparent text-[30px] outline-none"
              />
              <div className="mt-2 flex gap-2">
                {[25n, 50n, 100n].map((s) => (
                  <Pill key={String(s)} role="button" active={false} onClick={() => setShare(s)}>
                    {s === 100n ? 'Max' : `${s}%`}
                  </Pill>
                ))}
              </div>
            </div>

            <dl className="mt-5 divide-y divide-line text-[14px]">
              <div className="flex justify-between py-2.5">
                <dt className="text-muted">Reward</dt>
                <dd className="num">
                  +{amount ? formatAmount(reward, dec) : '0'} {TOKEN.ticker}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted">You get back</dt>
                <dd className="num">
                  {amount ? formatAmount(amount + reward, dec) : '0'} {TOKEN.ticker}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted">Unlocks</dt>
                <dd className="num">{when(now + days * DAY_SECONDS)}</dd>
              </div>
            </dl>

            <Button className="mt-5 w-full" disabled={blocked} busy={tx.state.status === 'pending'} onClick={submit}>
              {cta}
            </Button>
            <TxStatus state={tx.state} />
            <p className="mt-3 text-[12.5px] leading-snug text-muted">
              Sends {TOKEN.ticker} to the staking wallet {shortAddress(cfg.wallet.toBase58())} with a note naming the term.
            </p>
          </Panel>

          <Panel className="p-5 sm:p-7">
            <Label>Every term</Label>
            <TermsTable amount={amount && amount > 0n ? amount : null} decimals={dec} />
          </Panel>
        </div>

        <div className="space-y-7 lg:col-span-5">
          <Panel className="p-5 sm:p-7">
            <Label>How it works</Label>
            <ul className="mt-3 space-y-2.5 text-[14px] leading-snug">
              <li>Your {TOKEN.ticker} goes to the team staking wallet, not a smart contract. You are trusting the team to pay it back.</li>
              <li>After the unlock date the team sends principal plus reward to your wallet, usually within a day.</li>
              <li>Rewards come from a fixed pool the team funded. When the pool is used up, new locks stop. Locks already made are covered first.</li>
              <li>Each payout carries a note pointing at your lock, so anyone can check that every due lock was paid.</li>
              <li>Not audited. Not financial advice. Only lock what you can afford to lose.</li>
            </ul>
          </Panel>

          <Panel className="p-5 sm:p-7">
            <Label>${TOKEN.ticker} contract</Label>
            <div className="mt-3">
              <CopyAddress value={mint} />
            </div>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              <ExtLink href={links.dexscreener}>DexScreener</ExtLink>
              <ExtLink href={links.pumpfun}>pump.fun</ExtLink>
              <ExtLink href={links.gmgn}>GMGN</ExtLink>
              <ExtLink href={links.solscan}>Solscan</ExtLink>
            </p>
          </Panel>

          <Panel className="p-5 sm:p-7">
            <Label>Your locks</Label>
            {!owner ? (
              <p className="mt-3 text-[14px] text-muted">Connect a Solana wallet to see your locks and unlock dates.</p>
            ) : !b ? (
              <Skeleton className="mt-4 h-20" />
            ) : mine.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">No locks from this wallet yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {mine.map((l) => (
                  <LockRow key={l.signature} l={l} decimals={dec} now={now} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-5 pt-5 sm:px-7">
          <Label>${TOKEN.ticker} chart</Label>
          <span className="text-[13px]">
            <ExtLink href={links.dexscreener}>Open DexScreener</ExtLink>
          </span>
        </div>
        <iframe
          title={`${TOKEN.ticker} price chart on DexScreener`}
          src={dexEmbed(mint, dark)}
          className="mt-4 h-[480px] w-full border-0 sm:h-[560px]"
          loading="lazy"
        />
      </Panel>

      <Panel className="p-5 sm:p-7">
        <Label>All locks</Label>
        {book.isError ? (
          <p className="mt-3 text-[14px] text-muted">Could not read the staking wallet right now. Retrying.</p>
        ) : !b ? (
          <Skeleton className="mt-4 h-24" />
        ) : b.locks.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted">No locks yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {b.locks.slice(0, 50).map((l) => (
              <LockRow key={l.signature} l={l} decimals={dec} now={now} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
