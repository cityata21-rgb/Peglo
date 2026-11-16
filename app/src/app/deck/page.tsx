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

function Slide({ n, kicker, title, children }: { n: number; kicker?: string; title?: ReactNode; children?: ReactNode }) {
  return (
    <section className="slide" id={`s${n}`}>
      <div className="slide-inner">
        <header className="slide-head">
          <span className="brand">
            <LogoMark className="mark" />
            Peglo
          </span>
          <span>{String(n).padStart(2, '0')}</span>
        </header>
        {kicker && <p className="kicker">{kicker}</p>}
        {title && <h2 className="slide-title">{title}</h2>}
        <div className="slide-body">{children}</div>
      </div>
    </section>
  )
}

function Cards({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="cards" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(([h, b]) => (
        <div key={h} className="card">
          <h3>{h}</h3>
          <p>{b}</p>
        </div>
      ))}
    </div>
  )
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="rows">
      {rows.map(([a, b]) => (
        <div key={a}>
          <dt>{a}</dt>
          <dd>{b}</dd>
        </div>
      ))}
    </dl>
  )
}

const PARTNERS = [
  ['Solana', '/brand/solana.svg'],
  ['1inch Aqua', '/brand/1inch.png'],
  ['Chainlink CRE', '/brand/chainlink.png'],
  ['Base', '/brand/base.svg'],
]

export default function Deck() {
  return (
    <main className="deck">
      <DeckControls />

      <section className="slide cover" id="s1">
        <div className="slide-inner">
          <header className="slide-head">
            <span className="brand">
              <LogoMark className="mark" />
              Peglo
            </span>
            <span>Live on Solana mainnet</span>
          </header>
          <h1>
            Liquidity that
            <br />
            never leaves
          </h1>
          <p className="lede">Stablecoin FX markets and depeg backstops, made from balances that stay in the LP&apos;s wallet.</p>
          <div className="partners">
            {PARTNERS.map(([label, logo]) => (
              <span key={label}>
                <Image src={logo} alt="" width={32} height={32} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Slide n={2} kicker="Problem" title="Stablecoins sit idle, and pools fail in a depeg">
        <Cards
          items={[
            ['Idle capital', 'Hundreds of billions in stablecoins sit in wallets and treasuries earning nothing. Earning fees means locking them in a pool.'],
            ['One job per dollar', 'Coins in a pool cannot do anything else. A treasury has to pick one use for every dollar.'],
            ['Depegs hit LPs', 'When a coin breaks, arbitrage dumps it into pools. LPs hold the broken coin and liquidity vanishes when it is needed most.'],
          ]}
        />
      </Slide>

      <Slide n={3} kicker="Solution" title="One balance, two jobs, zero deposits">
        <Cards
          items={[
            ['FX range', 'Prices up to 8 stablecoins on one concentrated curve. Dollar coins at $1, EURC and BRZ at live FX. Up to 301x capital efficiency.'],
            ['Peg backstop', 'Dormant until the oracle halts a broken coin. Then buys it below market, pays in healthy coins, never above face value.'],
            ['Same wallet', 'Both are permissions over coins the LP keeps. Nothing moves until a trade fills, and the taker is paid straight from the wallet.'],
          ]}
        />
      </Slide>

      <Slide n={4} kicker="How it works" title="A swap, start to finish">
        <ol className="flow">
          <li>
            <b>Trader</b>
            <span>asks for USDC to EURC</span>
          </li>
          <li>
            <b>SDK</b>
            <span>splits across every LP, one transaction</span>
          </li>
          <li>
            <b>Program</b>
            <span>reads prices and halts from the oracle</span>
          </li>
          <li>
            <b>Curve</b>
            <span>prices the leg, checks the LP never loses value</span>
          </li>
          <li>
            <b>LP wallet</b>
            <span>pays the trader directly as SPL delegate</span>
          </li>
        </ol>
        <p className="note">
          In a depeg the sentinel halts the coin. Every range refuses it, and only backstops buy it, at a discount their LPs chose in advance.
        </p>
      </Slide>

      <Slide n={5} kicker="Why Solana" title="Where stablecoin FX lives">
        <Rows
          rows={[
            ['Coins', 'USDC, USDT, PYUSD, USDG, USDS, USDe, EURC and BRZ are all native SPL or Token-2022 mints.'],
            ['Cost', 'A swap costs 0.000005 SOL and about 50,000 compute units per leg, so small LPs and small trades work.'],
            ['Custody', 'SPL delegates give the same property as 1inch Aqua: coins stay in the wallet until a fill.'],
            ['Reach', 'Payment apps, treasuries and issuers already settle on Solana.'],
          ]}
        />
      </Slide>

      <Slide n={6} kicker="Traction" title="Built, tested and live">
        <div className="stats">
          <div>
            <b>Mainnet</b>
            <span>Solana program and oracle live since 15 Nov 2026</span>
          </div>
          <div>
            <b>4 networks</b>
            <span>Solana mainnet and devnet, Base and Base Sepolia</span>
          </div>
          <div>
            <b>1.12 bps</b>
            <span>measured cost of a $10,000 USDC to DAI swap</span>
          </div>
          <div>
            <b>600</b>
            <span>Rust to TypeScript parity cases, exact match</span>
          </div>
          <div>
            <b>745</b>
            <span>SDK tests, plus 80 contract tests and 21 end-to-end checks</span>
          </div>
          <div>
            <b>0.275 SOL</b>
            <span>to deploy a 52 KB program, mostly a refundable deposit</span>
          </div>
        </div>
      </Slide>

      <Slide n={7} kicker="Market" title="A large market with no depeg buyer">
        <Rows
          rows={[
            ['Supply', 'Stablecoin supply passed $250B in 2025, with more than $10B on Solana.'],
            ['FX', 'Euro and real stablecoins grow fastest and trade in the thinnest pairs.'],
            ['Gap', 'No venue offers a standing, pre-priced buyer for a coin in a depeg.'],
            ['Users', 'Treasuries, DAOs, market makers, issuers, payment apps and holders.'],
          ]}
        />
      </Slide>

      <Slide n={8} kicker="Competition" title="Pools leave in a depeg. Peglo stays and gets paid.">
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
            <tr>
              <td>Coins leave the wallet</td>
              <td>Yes</td>
              <td>Yes</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Coins per strategy</td>
              <td>2 to 8</td>
              <td>2</td>
              <td>Up to 8</td>
            </tr>
            <tr>
              <td>FX on the same curve</td>
              <td>No</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Same capital, several jobs</td>
              <td>No</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>In a depeg</td>
              <td>LPs absorb it</td>
              <td>LPs absorb it</td>
              <td>Backstops buy at a set discount</td>
            </tr>
          </tbody>
        </table>
      </Slide>

      <Slide n={9} kicker="Business model" title="Earn when LPs earn">
        <Cards
          items={[
            ['Today', 'No protocol fee. LPs keep 100% of swap fees and backstop discounts while we grow liquidity.'],
            ['Protocol share', 'After an audit, a share of LP fees and backstop discounts goes to a treasury, shown in every quote.'],
            ['Integrators and issuers', 'Aggregators add their own fee on top. Issuers fund dedicated backstops for their coin.'],
          ]}
        />
      </Slide>

      <Slide n={10} kicker="Go to market" title="Solana first, then everywhere stablecoins move">
        <Rows
          rows={[
            ['1', 'Seed with a few treasuries and market makers holding idle USDC and USDT.'],
            ['2', 'Get routed by Solana aggregators so every USDC to EURC or BRZ trade can reach Peglo.'],
            ['3', 'Offer issuers a standing backstop and deep pairs against every other stablecoin.'],
            ['4', 'Publish the math, depeg simulations and live costs so anyone can check every number.'],
          ]}
        />
      </Slide>

      <Slide n={11} kicker="Roadmap" title="Next twelve months">
        <div className="timeline">
          <div>
            <b>Done</b>
            <span>Base with 1inch Aqua and Chainlink CRE. Solana devnet and mainnet.</span>
          </div>
          <div>
            <b>Next</b>
            <span>Audit. Multisig upgrade authority. Sentinel on a keyed RPC with alerts.</span>
          </div>
          <div>
            <b>Then</b>
            <span>Aggregator routing. First real LPs with capped strategies.</span>
          </div>
          <div>
            <b>Later</b>
            <span>Protocol fee and treasury. More FX stablecoins. Several independent reporters.</span>
          </div>
        </div>
      </Slide>

      <Slide n={12} kicker="Ask" title="What we are looking for">
        <Cards
          items={[
            ['First LPs', 'Treasuries and market makers willing to run small, capped strategies.'],
            ['Routing', 'Aggregators and payment apps that want the cheapest stablecoin FX on Solana.'],
            ['Audit and grants', 'Support to audit the program and harden the oracle before scaling.'],
          ]}
        />
        <p className="note">Live on Solana mainnet · built by a small independent team</p>
      </Slide>
    </main>
  )
}
