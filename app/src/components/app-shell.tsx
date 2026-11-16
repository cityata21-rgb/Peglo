'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { RequireDeployment, useMaybePeglo, useNetwork, useOracleStatus, usePeglo } from '@/lib/peglo'
import { DEV_ACCOUNTS, NETWORK_LABELS } from '@/lib/config'
import { AccountMenu } from './account-menu'
import { ThemeToggle } from './theme-toggle'
import { LogoMark } from './brand'
import { SiteFooter } from './site-footer'

export { LogoMark }

const NAV = [
  { href: '/swap', label: 'Swap' },
  { href: '/liquidity', label: 'Liquidity' },
  { href: '/pool', label: 'Pool' },
  { href: '/activity', label: 'Activity' },
  { href: '/stake', label: 'Stake' },
  { href: '/lab', label: 'Depeg' },
  { href: '/docs', label: 'Docs' },
]


function NetworkPill() {
  const { chain } = usePeglo()
  const oracle = useOracleStatus()
  const halted = oracle.data?.filter((s) => s.halted).length ?? 0
  return (
    <div className="hidden min-h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[12.5px] lg:flex">
      <span className={`size-2 rounded-full ${halted ? 'bg-down' : 'bg-up'}`} aria-hidden />
      <span className="text-muted">{chain.name}</span>
      <span>{halted ? `${halted} halted` : 'Pegs live'}</span>
    </div>
  )
}

function NetworkSwitch({ className = '' }: { className?: string }) {
  const { current, available, select } = useNetwork()
  if (available.length < 2) return null
  if (available.length > 2) {
    return (
      <label className={`${className} relative min-h-9 shrink-0 items-center rounded-lg border border-line bg-surface text-[12.5px]`}>
        <span className="sr-only">Network</span>
        <select
          value={current ?? ''}
          onChange={(e) => select(e.target.value)}
          className="h-9 cursor-pointer appearance-none rounded-lg bg-transparent pr-8 pl-3 outline-none"
        >
          {available.map((n) => (
            <option key={n} value={n}>
              {NETWORK_LABELS[n] ?? n}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-muted" aria-hidden />
      </label>
    )
  }
  return (
    <div role="radiogroup" aria-label="Network" className={`${className} min-h-9 shrink-0 items-center rounded-lg border border-line bg-surface p-0.5 text-[12.5px]`}>
      {available.map((n) => {
        const on = n === current
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => !on && select(n)}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${on ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
          >
            {NETWORK_LABELS[n] ?? n}
          </button>
        )
      })}
    </div>
  )
}

function Nav({ path, className }: { path: string; className: string }) {
  return (
    <nav aria-label="Primary" className={`items-center ${className}`}>
      {NAV.filter((n) => DEV_ACCOUNTS || n.href !== '/lab').map((n) => {
        const active = path.startsWith(n.href)
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`py-2 text-[14px] whitespace-nowrap transition-colors ${active ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            {n.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const ctx = useMaybePeglo()
  if (path === '/' || path === '/deck') return <>{children}</>
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Peglo home">
            <LogoMark className="h-[21px] w-[18px]" />
            <span className="text-[18px] font-semibold tracking-[-0.02em]">Peglo</span>
          </Link>
          <Nav path={path} className="hidden gap-7 lg:flex" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NetworkSwitch className="hidden sm:flex" />
            {ctx && <NetworkPill />}
            <ThemeToggle className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface transition-colors hover:bg-surface-hover [&>svg]:size-4" />
            {ctx && <AccountMenu />}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-1 lg:hidden">
          <Nav path={path} className="flex min-w-0 flex-1 gap-4 overflow-x-auto sm:justify-center sm:gap-7" />
          <NetworkSwitch className="flex sm:hidden" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
        {path === '/docs' || path === '/litepaper' ? children : <RequireDeployment>{children}</RequireDeployment>}
      </main>
      <SiteFooter />
    </>
  )
}
