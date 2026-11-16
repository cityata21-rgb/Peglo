import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Halcyon litepaper',
  description: 'The math behind Halcyon: a sphere AMM over wallet balances, depeg backstops with a path-independent discount, and the oracle policy that decides when a stablecoin is broken.',
}

const SECTIONS: [string, string][] = [
  ['abstract', 'Abstract'],
  ['intro', '1. Introduction'],
  ['custody', '2. Liquidity that stays in the wallet'],
  ['curve', '3. FX ranges: the sphere curve'],
  ['backstop', '4. Peg backstops'],
  ['oracle', '5. Prices and the depeg policy'],
  ['impl', '6. Implementation'],
  ['economics', '7. Economics'],
  ['risks', '8. Risks and limits'],
  ['refs', 'References'],
]

function Tex({ children }: { children: string }) {
  return (
    <div
      className="my-5 overflow-x-auto rounded-xl border border-line bg-surface px-4 py-4 text-center text-[15px]"
      dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { displayMode: true, throwOnError: false, output: 'html' }) }}
    />
  )
}

function M({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: false, output: 'html' }) }} />
}

function Section({ id, children }: { id: string; children: ReactNode }) {
  const title = SECTIONS.find(([s]) => s === id)![1]
  return (
    <section id={id} className="scroll-mt-28 border-t border-line pt-10">
      <h2 className="title text-[20px] leading-tight sm:text-[24px]">{title}</h2>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="max-w-[46em] text-[15px] leading-relaxed">{children}</p>
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-4 text-[12px] font-medium tracking-[0.08em] uppercase">{children}</h3>
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="max-w-[46em] space-y-2 text-[15px] leading-relaxed">
      {items.map((it, k) => (
        <li key={k} className="relative pl-6">
          <span className="absolute top-[0.65em] left-1 size-1.5 rounded-full bg-current" aria-hidden />
          {it}
        </li>
      ))}
    </ul>
  )
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="ink-card overflow-x-auto">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} scope="col" className="px-5 py-3 text-[10.5px] font-medium tracking-[0.08em] text-muted uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} className="border-b border-line last:border-0">
              {r.map((cell, j) => (
                <td key={j} className={`num px-5 py-3 align-top text-[14px] ${j === 0 ? 'font-medium' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Litepaper() {
  return (
    <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <nav aria-label="Sections" className="sticky top-28 space-y-2 text-[13px]">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="block text-muted hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="min-w-0 space-y-12">
        <header>
          <p className="font-mono text-[10.5px] tracking-[0.08em] text-muted uppercase">Litepaper · v1 · November 2026</p>
          <h1 className="title mt-3 text-[30px] leading-[1.05] sm:text-[44px]">
            Halcyon: liquidity
            <br />
            that never leaves
          </h1>
          <p className="mt-5 max-w-[40em] text-[16px] leading-relaxed text-muted">
            A stablecoin market where one wallet balance prices FX across eight coins every day and stands behind every coin when one breaks, without
            the coins ever leaving the wallet.
          </p>
        </header>

        <Section id="abstract">
          <P>
            Halcyon is a market for stablecoins built on two strategy types over the same wallet balance. An <b>FX range</b> prices up to eight
            stablecoins on one concentrated sphere curve, with dollar coins at $1 and non-dollar coins such as EURC and BRZ at live FX rates. A{' '}
            <b>peg backstop</b> stays dormant until an oracle halts a broken coin, then buys it at a discount that grows with size and is
            independent of how a seller splits their trade. Liquidity providers never deposit: on Solana a strategy approves the Halcyon program as
            an SPL token delegate, and on Base it is a 1inch Aqua allowance. This paper gives the pricing math, the safety checks every swap
            passes, the depeg policy and the implementation that is live on Solana mainnet.
          </P>
        </Section>

        <Section id="intro">
          <P>
            Stablecoins in wallets and treasuries mostly earn nothing. Earning swap fees means locking them in a pool, and pools fail their LPs in
            the one moment that matters: when a coin depegs, arbitrageurs sell the broken coin into the pool and withdraw the healthy ones. LPs end
            the day holding the broken coin, and the market loses its liquidity when holders need it most.
          </P>
          <P>Halcyon separates two jobs that pools merge into one:</P>
          <Bullets
            items={[
              <>
                <b>Everyday FX.</b> Tight, cheap swaps between any two of eight stablecoins, across currencies.
              </>,
              <>
                <b>Crisis liquidity.</b> A standing buyer for a broken coin, at a price the LP chose in advance, that only trades after an
                independent oracle says the coin is broken.
              </>,
            ]}
          />
          <P>
            Because neither job requires a deposit, the same dollars can do both. A backstop costs nothing to keep on calm days, because its coins
            earn FX fees in a range until they are needed.
          </P>
        </Section>

        <Section id="custody">
          <P>
            Let a maker hold balances <M>{'x_1, \\dots, x_n'}</M> of <M>n</M> coins in their own wallet. A strategy is a record of which coins it
            may use and its parameters. It never holds coins.
          </P>
          <Table
            head={['', 'Solana', 'Base']}
            rows={[
              ['Permission', 'SPL Approve to a per-maker program address', '1inch Aqua allowance (ship)'],
              ['Strategy record', 'Program account, 408 bytes', 'SwapVM program, up to 219 bytes'],
              ['On a fill', 'Taker coin into maker account, payout from it as delegate', 'Aqua pulls input, pushes output'],
              ['Ending it', 'Close refunds rent, delegate revoked when unused', 'Dock removes the allowance'],
            ]}
          />
          <P>
            Every swap reads the maker&apos;s live balance <M>{'x_k'}</M> at the moment of the trade. Two strategies may cover the same coins; the
            first fill uses them and the other sees the smaller balance on its next quote. This is what lets one balance back a range and a
            backstop at the same time.
          </P>
        </Section>

        <Section id="curve">
          <H3>3.1 Virtual balances</H3>
          <P>
            Each coin <M>k</M> has an oracle price <M>{'\\rho_k'}</M> in USD and <M>{'d_k'}</M> decimals. The range adds a virtual floor{' '}
            <M>m</M> under every coin:
          </P>
          <Tex>{'v_k = \\frac{x_k \\, \\rho_k}{10^{d_k}} + m'}</Tex>
          <P>
            Pricing in USD value rather than raw units is what puts EURC and BRZ on the same curve as the dollar coins: a euro coin simply has{' '}
            <M>{'\\rho \\approx 1.16'}</M>.
          </P>

          <H3>3.2 The invariant</H3>
          <P>Following Paradigm&apos;s work on AMMs for many stablecoins, reserves live on a sphere of radius r:</P>
          <Tex>{'\\sum_{k=1}^{n} (r - v_k)^2 = r^2'}</Tex>
          <P>
            Expanding with <M>{'S = \\sum v_k'}</M> and <M>{'Q = \\sum v_k^2'}</M> gives a quadratic in r, and the radius follows in closed form:
          </P>
          <Tex>{'(n-1)\\,r^2 - 2S\\,r + Q = 0 \\quad\\Longrightarrow\\quad r = \\frac{S + \\sqrt{S^2 - (n-1)\\,Q}}{n-1}'}</Tex>
          <P>
            The larger root is the right one: at the peg every <M>{'v_k = v^*'}</M>, so <M>{'S^2 - (n-1)Q = n\\,v^{*2}'}</M>, and the formula returns{' '}
            <M>{'r = v^* / (1 - 1/\\sqrt{n})'}</M>, the point where the sphere touches the equal-price line.
          </P>

          <H3>3.3 Concentration</H3>
          <P>
            If a maker opens with <M>D</M> dollars of each coin, at the peg <M>{'v^* = D + m'}</M>. Depth near the peg scales with <M>{'v^*'}</M>,
            not with <M>D</M>, so the capital efficiency of a range is:
          </P>
          <Tex>{'\\text{efficiency} = \\frac{D + m}{D}'}</Tex>
          <Table
            head={['Preset', 'Floor m', 'Efficiency', 'Fee, dollar pairs', 'Fee, FX pairs']}
            rows={[
              ['Tight', '300 D', '301x', '1 bp', '5 bps'],
              ['Balanced', '60 D', '61x', '4 bps', '10 bps'],
              ['Wide', '10 D', '11x', '10 bps', '30 bps'],
            ]}
          />

          <H3>3.4 Exact-in swap</H3>
          <P>
            A taker sells <M>a</M> of coin <M>i</M> for coin <M>j</M>. The fee <M>f</M> is taken from the input and stays with the maker. The input
            coin&apos;s virtual balance rises, every other coin except j is unchanged, and the output coin falls back onto the sphere:
          </P>
          <Tex>{"v_i' = v_i + \\frac{a(1-f)\\,\\rho_i}{10^{d_i}}, \\qquad v_j' = r - \\sqrt{\\,r^2 - \\sum_{k \\ne j} (r - v_k')^2\\,}"}</Tex>
          <Tex>{"\\text{out} = \\frac{(v_j - v_j')\\,10^{d_j}}{\\rho_j} - 1"}</Tex>
          <P>
            Two square roots and no iteration: one for the radius, one for the output. The final unit is rounded down in the maker&apos;s favour.
          </P>

          <H3>3.5 Marginal price</H3>
          <P>Differentiating the invariant along the sphere gives the price of i in units of j:</P>
          <Tex>{'p_{ij} = \\frac{r - v_i}{r - v_j} \\cdot \\frac{\\rho_i}{\\rho_j}'}</Tex>
          <P>
            At the peg the first factor is 1 and coins trade at their oracle ratio. As a coin piles up, <M>{'r - v_i'}</M> shrinks and the range
            pays less for more of it.
          </P>

          <H3>3.6 Checks every swap passes</H3>
          <Bullets
            items={[
              <>
                <b>LP never loses value.</b> The radius is recomputed from the balances after the swap and the swap fails unless{' '}
                <M>{"r' \\ge r"}</M>. Fees and rounding make <M>r</M> grow.
              </>,
              <>
                <b>Range edge.</b> If <M>{"\\sum v_k' > \\kappa\\, r"}</M> and the input coin is now the heaviest, the swap fails. A range stops
                buying a falling coin instead of absorbing all of it.
              </>,
              <>
                <b>Exposure cap.</b> No coin may exceed a share <M>s</M> of the range, <M>{"v_i' - m \\le s \\sum_k (v_k' - m)"}</M>, with{' '}
                <M>{'s = 2/n'}</M> by default.
              </>,
              <>
                <b>Real balance.</b> The output can never exceed what the maker&apos;s wallet actually holds and has delegated.
              </>,
              <>
                <b>Oracle state.</b> A halted coin is refused as input, and an FX coin whose price is older than the oracle&apos;s maximum age
                pauses.
              </>,
            ]}
          />

          <H3>3.7 Worked example</H3>
          <P>
            A Tight range with $1,000,000 of each of 8 dollar coins, computed directly from the formulas above, compared with a constant-product
            pool holding the same $1,000,000 on each side:
          </P>
          <Table
            head={['Trade', 'Tight range, output', 'Tight range, cost', 'x · y = k, cost']}
            rows={[
              ['$10,000', '9,998.39', '1.6 bps', 'about 99 bps'],
              ['$100,000', '99,929.30', '7.1 bps', 'about 910 bps'],
              ['$1,000,000', '993,863.26', '61 bps', 'about 5,000 bps'],
            ]}
          />
          <P>
            Measured live on Base Sepolia with deeper test liquidity, $10,000 USDC to DAI cost 1.12 bps and $10,000 USDC to EURC cost 5.12 bps, of
            which 5 bps is the FX fee.
          </P>
        </Section>

        <Section id="backstop">
          <P>
            A backstop pledges healthy coins, a cap <M>C</M> per coin it will buy, and a discount schedule from <M>{'d_0'}</M> to{' '}
            <M>{'d_1'}</M>. Until the oracle halts a coin, every quote fails with <M>{'\\texttt{NotDepegged}'}</M>.
          </P>
          <H3>4.1 Price</H3>
          <P>
            With <M>A</M> already absorbed and a seller offering <M>a</M> (both in face value), the discount and payout are:
          </P>
          <Tex>{'d = d_0 + (d_1 - d_0)\\,\\frac{A + a/2}{C}, \\qquad \\text{out} = \\frac{a \\cdot \\min(\\text{market}, 1) \\cdot (1 - d)}{p_{\\text{out}}}'}</Tex>
          <P>
            The trade fails if <M>{'A + a > C'}</M>. It pays only in coins that are not halted, and the <M>{'\\min(\\cdot, 1)'}</M> means a
            backstop never pays above face value even if a market feed says otherwise.
          </P>
          <H3>4.2 Splitting does not help</H3>
          <P>
            The discount is the average of a linear schedule over the interval <M>{'[A, A + a]'}</M>. For two sales <M>{'a_1'}</M> then{' '}
            <M>{'a_2'}</M>, with <M>{'k = (d_1 - d_0)/C'}</M>:
          </P>
          <Tex>{'a_1\\big(d_0 + k(A + \\tfrac{a_1}{2})\\big) + a_2\\big(d_0 + k(A + a_1 + \\tfrac{a_2}{2})\\big) = (a_1 + a_2)\\big(d_0 + k(A + \\tfrac{a_1 + a_2}{2})\\big)'}</Tex>
          <P>
            The total discount is the same as one sale of <M>{'a_1 + a_2'}</M>. Sellers cannot game the schedule by slicing, the first dollar
            sold gets the best price, and no single trade can drain a backstop past its cap.
          </P>
          <Table
            head={['Preset', 'Discount d0 to d1', 'Average if fully used']}
            rows={[
              ['Light', '1% to 5%', '3%'],
              ['Standard', '2% to 10%', '6%'],
              ['Deep', '5% to 25%', '15%'],
            ]}
          />
          <P>
            While a coin is halted, every FX range refuses it as input. Healthy pairs keep trading. The only buyers of the broken coin are
            backstops, at prices their makers chose before the crisis.
          </P>
        </Section>

        <Section id="oracle">
          <P>
            The oracle stores, per coin, a price, the time it was observed and a halted flag. FX prices and depeg prices are used only while
            fresh, <M>{'t_{\\text{now}} - t_{\\text{obs}} \\le \\tau'}</M>, with <M>{'\\tau'}</M> = 15 minutes on Solana mainnet. Dollar coins
            price at $1 and need no update.
          </P>
          <P>
            A reporter (Chainlink CRE on Base, the Halcyon sentinel on Solana) reads several independent sources and applies one policy. Let{' '}
            <M>{'\\delta_{\\text{api}}'}</M> be the smallest deviation from peg across the offchain APIs (so every API must agree) and{' '}
            <M>{'\\delta_{\\text{feed}}'}</M> the deviation of the market feed:
          </P>
          <Tex>{'\\text{halt} \\iff \\delta_{\\text{api}} \\ge 300\\text{ bps} \\;\\lor\\; \\delta_{\\text{feed}} \\ge 300\\text{ bps} \\;\\lor\\; \\big(\\delta_{\\text{api}} \\ge 75 \\land \\delta_{\\text{feed}} \\ge 75\\big)'}</Tex>
          <Tex>{'\\text{resume} \\iff \\max_{\\text{source}} \\delta \\le 25\\text{ bps}'}</Tex>
          <P>
            The gap between 300 bps to halt and 25 bps to resume prevents flapping, and requiring every source for a resume means one lagging API
            cannot lift a halt. FX rates are pushed on a 2 bp move or every 10 minutes. Sources on Solana: Pyth price accounts, ECB rates through
            Frankfurter, open.er-api, CoinGecko and DefiLlama.
          </P>
        </Section>

        <Section id="impl">
          <H3>Solana</H3>
          <Bullets
            items={[
              'Native program in Rust with Pinocchio, 52 KB, no Anchor and no allocator, so deploying cost about 0.275 SOL.',
              'All math in u128 with prices scaled by 10^9. Square roots are floor Newton iterations, and every rounding step favours the maker.',
              'The amount received is measured after the transfer in, so a Token-2022 transfer fee is never counted as income. PYUSD and USDG are Token-2022 coins.',
              'A swap pays from a maker only through that maker’s delegate address and only up to the delegated amount.',
              '600 generated cases (up to 8 coins, 4, 6 and 9 decimals, ranges and backstops) give the same output or the same error in Rust and in the TypeScript SDK.',
            ]}
          />
          <H3>Base</H3>
          <Bullets
            items={[
              'Two new 1inch SwapVM instructions: HalcyonTick (opcode 34) for ranges and HalcyonBackstop (opcode 35).',
              'Both also run on 1inch’s official AquaSwapVMRouter through its Extruction opcode, with no 1inch contract modified.',
              'An 8-coin range config packs into 219 bytes, under SwapVM’s 255-byte argument limit.',
              'A Chainlink CRE workflow in Go reports rates and halts with consensus across nodes.',
            ]}
          />
          <H3>Routing</H3>
          <P>
            The SDK splits a trade into 64 slices and gives each slice to the strategy with the best marginal price across every maker, halving
            slices near a range edge. The result is one transaction, and the quoted amount equals the received amount exactly.
          </P>
        </Section>

        <Section id="economics">
          <P>An LP earns from two sources over the same balance:</P>
          <Bullets
            items={[
              <>
                <b>Range fees.</b> 1 to 10 bps per dollar-pair trade and 5 to 30 bps per FX trade, compounding into the radius.
              </>,
              <>
                <b>Backstop discount.</b> Paid only in a depeg. Example: a Standard backstop with a $100,000 cap buys a coin halted at $0.93. Fully
                used, it pays about <M>{'0.93 \\times 0.94 \\approx 0.874'}</M> per coin. If the coin recovers to $1, the backstop gains about
                14%; if it never recovers, the LP holds the broken coin, capped at $100,000 of face value.
              </>,
            ]}
          />
          <P>
            Today the protocol takes no fee. The planned model, after an audit, is a protocol share of LP fees and backstop discounts sent to a
            treasury, shown in every quote, so traders pay the same price and LPs keep the majority.
          </P>
        </Section>

        <Section id="risks">
          <Bullets
            items={[
              'The Solana program and the Base contracts have not been audited.',
              'The oracle reporter and upgrade authority are single keys today; moving them to a multisig is planned.',
              'If the reporter stops, FX prices expire and FX pairs pause. Dollar pairs keep trading at $1.',
              'A backstop takes real depeg risk by design: if a halted coin never recovers, the LP keeps what it bought, up to its cap.',
              'Pricing dollar coins at $1 relies on the halt policy catching a depeg; between a depeg and a halt, ranges still trade at $1 within their edge and exposure cap.',
            ]}
          />
        </Section>

        <Section id="refs">
          <Bullets
            items={[
              <a key="p" href="https://www.paradigm.xyz/2025/06/orbital" target="_blank" rel="noreferrer" className="underline">
                Paradigm, AMMs for many stablecoins (White, Robinson, Moallemi, 2025)
              </a>,
              <a key="a" href="https://github.com/1inch/aqua" target="_blank" rel="noreferrer" className="underline">
                1inch Aqua
              </a>,
              <a key="s" href="https://github.com/1inch/swap-vm" target="_blank" rel="noreferrer" className="underline">
                1inch SwapVM
              </a>,
              <a key="c" href="https://docs.chain.link/cre" target="_blank" rel="noreferrer" className="underline">
                Chainlink Runtime Environment
              </a>,
              <a key="pi" href="https://github.com/anza-xyz/pinocchio" target="_blank" rel="noreferrer" className="underline">
                Pinocchio
              </a>,
            ]}
          />
        </Section>
      </article>
    </div>
  )
}
