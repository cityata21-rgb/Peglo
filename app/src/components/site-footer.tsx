import Image from 'next/image'
import Link from 'next/link'
import { FOOTER_COLUMNS } from '@/lib/links'
import { LogoMark } from './brand'

const PARTNERS = [
  { label: 'Solana', logo: '/brand/solana.svg' },
  { label: '1inch Aqua', logo: '/brand/1inch.png' },
  { label: 'Chainlink CRE', logo: '/brand/chainlink.png' },
  { label: 'Base', logo: '/brand/base.svg' },
]

export function SiteFooter() {
  const columns = FOOTER_COLUMNS.map((c) => ({ ...c, links: c.links.filter((l) => l.href) })).filter((c) => c.links.length > 0)
  return (
    <footer className="site-footer border-t border-line font-sans text-ink">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-8 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Peglo home">
            <LogoMark className="h-[21px] w-[18px]" />
            <span className="text-[18px] font-semibold tracking-[-0.02em]">Peglo</span>
          </Link>
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
            Liquidity that never leaves. One wallet balance makes stablecoin FX markets and backs every coin when one breaks.
          </p>
          <p className="mt-4 text-[12px] leading-relaxed text-muted">Not audited. Use small amounts.</p>
        </div>
        <nav aria-label="Footer" className="contents">
          {columns.map((c) => (
            <div key={c.title}>
              <h2 className="font-mono text-[10.5px] tracking-[0.08em] text-muted uppercase">{c.title}</h2>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="hover:underline">
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link href={l.href!} className="hover:underline">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-5 font-mono text-[10.5px] tracking-[0.06em] text-muted uppercase sm:px-6">
        <span>© 2026 Peglo · MIT</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {PARTNERS.map((p) => (
            <span key={p.label} className="flex items-center gap-1.5">
              <Image src={p.logo} alt="" width={32} height={32} className="size-4 rounded-full" />
              {p.label}
            </span>
          ))}
        </span>
      </div>
    </footer>
  )
}
