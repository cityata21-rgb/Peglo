import type { Metadata } from 'next'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { LogoMark } from '@/components/brand'
import { DeckControls } from './controls'
import './deck.css'

export const metadata: Metadata = {
  title: 'Peglo pitch deck',
  description: 'Peglo: stablecoin FX and depeg backstops from wallet balances, live on Solana mainnet.',
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Goudy+Bookletter+1911&display=swap'

function Head({ n }: { n: number }) {
  return (
    <header className="slide-head">
      <span className="brand">
        <LogoMark className="mark" />
        Peglo
      </span>
      <span>{String(n).padStart(2, '0')} / 12</span>
    </header>
  )
}

function Slide({ n, kicker, title, children, className = '' }: { n: number; kicker?: string; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={`slide ${className}`} id={`s${n}`}>
      <div className="slide-inner">
        <Head n={n} />
        {kicker && <p className="kicker">{kicker}</p>}
        {title && <h2 className="slide-title">{title}</h2>}
        {children}
      </div>
    </section>
  )
}

function Waves({ className = '' }: { className?: string }) {
  return (
    <svg className={`waves ${className}`} viewBox="0 0 1600 140" preserveAspectRatio="none" aria-hidden>
      <path d="M0 40 C 130 10, 270 70, 400 40 S 670 10, 800 40 S 1070 70, 1200 40 S 1470 10, 1600 40" />
      <path d="M0 85 C 140 55, 280 115, 420 85 S 690 55, 830 85 S 1100 115, 1240 85 S 1500 55, 1600 85" />
      <path d="M0 125 C 130 95, 270 155, 400 125 S 670 95, 800 125 S 1070 155, 1200 125 S 1470 95, 1600 125" />
    </svg>
  )
}

function Shot({ src, caption }: { src: string; caption?: string }) {
  return (
    <figure className="shot">
      <div className="shot-bar">
        <i />
        <i />
        <i />
        <span>peglo.fun</span>
      </div>
      <Image unoptimized src={src} alt="" width={1440} height={810} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

const PARTNERS = [
  ['Solana', '/brand/solana.svg'],
  ['1inch Aqua', '/brand/1inch.png'],
  ['Chainlink CRE', '/brand/chainlink.png'],
  ['Base', '/brand/base.svg'],
]

const COINS = ['USDC', 'USDT', 'PYUSD', 'USDG', 'USDS', 'USDe', 'EURC', 'BRZ']

const COST: [string, number, number][] = [
  ['$10k', 1.6, 99],
  ['$100k', 7.07, 910],
  ['$1M', 61, 5000],
]

function CostChart() {
  const h = 300
  const y = (bps: number) => (Math.log10(bps) + 1) / 5
  return (
    <svg className="chart" viewBox="0 0 640 380" aria-label="Swap cost in basis points, Peglo versus x*y=k">
      {[0.1, 1, 10, 100, 1000, 10000].map((t) => (
        <g key={t}>
          <line x1="70" x2="630" y1={330 - y(t) * h} y2={330 - y(t) * h} className="grid" />
          <text x="60" y={334 - y(t) * h} textAnchor="end" className="tick">
            {t >= 1000 ? `${t / 1000}k` : t}
          </text>
        </g>
      ))}
      {COST.map(([label, a, b], i) => {
        const x = 110 + i * 180
        return (
          <g key={label}>
            <rect x={x} y={330 - y(a) * h} width="56" height={y(a) * h} className="bar-a" />
            <rect x={x + 66} y={330 - y(b) * h} width="56" height={y(b) * h} className="bar-b" />
            <text x={x + 28} y={322 - y(a) * h} textAnchor="middle" className="val">
              {a}
            </text>
            <text x={x + 94} y={322 - y(b) * h} textAnchor="middle" className="val">
              {b.toLocaleString('en-US')}
            </text>
            <text x={x + 61} y="362" textAnchor="middle" className="lab">
              {label} swap
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const ICONS: Record<string, ReactNode> = {
  lock: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <rect x="10" y="22" width="28" height="20" rx="4" />
      <path d="M16 22v-6a8 8 0 0 1 16 0v6M24 30v5" />
    </svg>
  ),
  split: (
    <svg viewBox="0 0 48 48" aria-hidden>
      {[8, 20, 32].flatMap((x) => [10, 22, 34].map((yy) => <rect key={`${x}${yy}`} x={x} y={yy} width="8" height="6" rx="1.5" />))}
    </svg>
  ),
  drain: (
    <svg viewBox="0 0 48 48" aria-hidden>
      <path d="M6 12h10l6 16 6-8h14M6 40h36" />
    </svg>
  ),
}

export default function Deck() {
  return (
    <main className="deck">
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <DeckControls />

      <section className="slide cover" id="s1">
        <div className="slide-inner">
          <header className="slide-head">
            <span className="brand">
              <LogoMark className="mark" />
              Peglo
            </span>
            <span>
              <a href="https://peglo.fun">peglo.fun</a> · Live on Solana mainnet
            </span>
          </header>
          <Image unoptimized className="cover-ship" src="/landing/ship.webp" alt="" width={1600} height={1600} priority />
          <p className="eyebrow">USD · EUR · BRL</p>
          <h1>
            Liquidity that
            <br />
            never leaves
          </h1>
          <p className="lede">Stablecoin FX markets and depeg backstops, made from balances that stay in the LP&apos;s own wallet.</p>
          <div className="partners">
            {PARTNERS.map(([label, logo]) => (
              <span key={label}>
                <Image unoptimized src={logo!} alt="" width={32} height={32} />
                {label}
              </span>
            ))}
          </div>
          <Waves />
        </div>
      </section>

      <Slide n={2} kicker="The problem" title="Stablecoins sit idle, and pools fail in a depeg" className="has-bush">
        <div className="cards three">
          {[
            ['lock', 'Locked', 'Earning fees means handing your coins to a pool contract. Withdraw before you can use them.'],
            ['split', 'Split', '8 coins need 28 separate pools. Every pair is thin, and USDC to EURC cannot use USDC to USDT depth.'],
            ['drain', 'Drained', 'When a coin breaks, traders dump it into pools. LPs end up holding the coin nobody wants.'],
          ].map(([icon, h, b]) => (
            <div key={h} className="card ink">
              <span className="icon">{ICONS[icon!]}</span>
              <h3>{h}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
        <Image unoptimized className="deco-bush" src="/deck/bush.webp" alt="" width={500} height={406} />
      </Slide>

      <Slide n={3} kicker="The solution" title="One balance, two jobs, zero deposits">
        <div className="split">
          <div className="stack">
            <div className="card ink">
              <h3>FX range</h3>
              <p>One concentrated curve prices up to 8 stablecoins. Dollar coins at $1, EURC and BRZ at live FX. Up to 301x capital efficiency.</p>
            </div>
            <div className="card ink gold">
              <h3>Peg backstop</h3>
              <p>Sleeps until the oracle halts a broken coin, then buys it at a discount the LP chose. Never above face value.</p>
            </div>
            <p className="note">Both are permissions over coins the LP keeps. Nothing moves until a trade fills.</p>
          </div>
          <Shot src="/deck/liquidity.webp" caption="Opening a range: pick coins and a width. The coins stay in the wallet." />
        </div>
      </Slide>

      <Slide n={4} kicker="How it works" title="A swap, start to finish">
        <div className="split">
          <ol className="steps">
            <li>
              <b>Trader</b> asks for USDC to EURC
            </li>
            <li>
              <b>SDK</b> splits the trade across every LP, one transaction
            </li>
            <li>
              <b>Program</b> reads prices and halts from the oracle
            </li>
            <li>
              <b>Curve</b> prices each leg and checks the LP never loses value
            </li>
            <li>
              <b>LP wallet</b> pays the trader directly as an SPL delegate
            </li>
          </ol>
          <Shot src="/deck/swap.webp" caption="Live quote on devnet: 1,000 USDC to 907.54 EURC, one leg, one transaction." />
        </div>
      </Slide>

      <Slide n={5} kicker="The backstop" title="When a coin breaks" className="depeg">
        <div className="depeg-art">
          <Image unoptimized className="captain" src="/deck/captain.webp" alt="" width={900} height={775} />
          <Image unoptimized className="chest" src="/deck/chest.webp" alt="" width={400} height={351} />
          <span className="slip">
            buys USDe
            <br />
            at $0.93
          </span>
        </div>
        <ol className="halt">
          <li>
            <b>Watch</b>
            <span>The sentinel checks Pyth, the ECB, CoinGecko and DefiLlama for every coin.</span>
          </li>
          <li>
            <b>Halt</b>
            <span>3% off peg on any source, or 0.75% on both: the coin is halted. Every range refuses it.</span>
          </li>
          <li>
            <b>Buy</b>
            <span>Only backstops buy it, at the discount their owners set in advance, never above face value.</span>
          </li>
          <li>
            <b>Resume</b>
            <span>Under 0.25% on every source, the halt lifts and ranges trade it again.</span>
          </li>
        </ol>
        <Waves className="low" />
      </Slide>

      <Slide n={6} kicker="Why one curve" title="Deeper than dozens of pairs">
        <div className="split chart-split">
          <CostChart />
          <div className="stack">
            <div className="legend">
              <span>
                <i className="a" />
                Peglo Tight range
              </span>
              <span>
                <i className="b" />
                Classic x*y=k pool
              </span>
            </div>
            <p className="big">
              <b>7 bps</b> vs <b>910 bps</b>
            </p>
            <p className="note">Cost of a $100k swap with $1M per coin across 8 coins, same money in both. Computed with the Peglo SDK, which matches the program exactly.</p>
          </div>
        </div>
      </Slide>

      <Slide n={7} kicker="Traction" title="Built, tested and live">
        <div className="stats">
          {[
            ['Mainnet', 'Solana program and oracle live, first real range, swap and close done on mainnet'],
            ['4 networks', 'Solana mainnet and devnet, Base and Base Sepolia'],
            ['1.12 bps', 'measured cost of a $10,000 USDC to DAI swap on Base'],
            ['600', 'Rust to TypeScript parity cases, exact match'],
            ['749', 'SDK tests, plus 80 contract tests and end-to-end checks'],
            ['52 KB', 'Solana program, about 0.27 SOL to deploy, mostly a refundable deposit'],
          ].map(([b, s]) => (
            <div key={b}>
              <b>{b}</b>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </Slide>

      <Slide n={8} kicker="Why Solana" title="Where stablecoin FX lives">
        <div className="coins">
          {COINS.map((c) => (
            <span key={c}>
              <Image unoptimized src={`/coins/${c}.png`} alt="" width={64} height={64} />
              {c}
            </span>
          ))}
        </div>
        <dl className="rows">
          {[
            ['Market', 'Stablecoin supply passed $250B in 2025, more than $10B on Solana. Euro and real coins grow fastest in the thinnest pairs.'],
            ['Cost', 'A swap costs 0.000005 SOL and about 50,000 compute units per leg, so small LPs and small trades work.'],
            ['Custody', 'SPL delegates keep coins in the wallet until a fill, the same property as 1inch Aqua.'],
            ['Gap', 'No venue offers a standing, pre-priced buyer for a coin in a depeg.'],
          ].map(([a, b]) => (
            <div key={a}>
              <dt>{a}</dt>
              <dd>{b}</dd>
            </div>
          ))}
        </dl>
      </Slide>

      <Slide n={9} kicker="Competition" title="Pools leave in a depeg. Peglo stays and gets paid.">
        <table className="cmp">
          <thead>
            <tr>
              <th />
              <th>Curve</th>
              <th>Orca, Meteora</th>
              <th>Peglo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Coins leave the wallet', 'Yes', 'Yes', 'No'],
              ['Coins per strategy', '2 to 8', '2', 'Up to 8'],
              ['FX on the same curve', 'No', 'No', 'Yes'],
              ['Same capital, several jobs', 'No', 'No', 'Yes'],
              ['In a depeg', 'LPs absorb it', 'LPs absorb it', 'Backstops buy at a set discount'],
            ].map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (
                  <td key={i}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Slide>

      <Slide n={10} kicker="Business and go to market" title="Earn when LPs earn">
        <div className="two">
          <div className="stack">
            <div className="card ink">
              <h3>Today</h3>
              <p>No protocol fee. LPs keep 100% of swap fees and backstop discounts while liquidity grows.</p>
            </div>
            <div className="card ink">
              <h3>After an audit</h3>
              <p>A share of LP fees and backstop discounts goes to a treasury, shown in every quote. Issuers fund backstops for their own coin.</p>
            </div>
          </div>
          <ol className="gtm">
            <li>Seed with treasuries and market makers holding idle USDC and USDT.</li>
            <li>Get routed by Solana aggregators for every USDC to EURC or BRZ trade.</li>
            <li>Offer issuers a standing backstop and deep pairs against every coin.</li>
            <li>Publish the math and live costs so anyone can check every number.</li>
          </ol>
        </div>
      </Slide>

      <Slide n={11} kicker="Roadmap" title="Next twelve months" className="has-palm">
        <div className="timeline">
          {[
            ['Done', 'Base with 1inch Aqua and Chainlink CRE. Solana devnet and mainnet.'],
            ['Next', 'Audit. Multisig upgrade authority. Sentinel on a keyed RPC with alerts.'],
            ['Then', 'Aggregator routing. First real LPs with capped strategies.'],
            ['Later', 'Protocol fee and treasury. More FX stablecoins. Several reporters.'],
          ].map(([b, s]) => (
            <div key={b}>
              <b>{b}</b>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <Image unoptimized className="deco-palm" src="/deck/palm.webp" alt="" width={600} height={846} />
      </Slide>

      <Slide n={12} kicker="The ask" title="Come aboard" className="ask">
        <Image unoptimized className="ask-ship" src="/landing/ship.webp" alt="" width={1600} height={1600} />
        <div className="cards three">
          {[
            ['First LPs', 'Treasuries and market makers willing to run small, capped strategies.'],
            ['Routing', 'Aggregators and payment apps that want the cheapest stablecoin FX on Solana.'],
            ['Audit and grants', 'Support to audit the program and harden the oracle before scaling.'],
          ].map(([h, b]) => (
            <div key={h} className="card ink">
              <h3>{h}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
        <p className="links">
          <a href="https://peglo.fun">peglo.fun</a>
          <a href="https://peglo.fun/litepaper">peglo.fun/litepaper</a>
          <a href="https://github.com/cityata21-rgb/Peglo">github.com/cityata21-rgb/Peglo</a>
        </p>
        <Waves className="low" />
      </Slide>
    </main>
  )
}
