import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'
import { StabrixProvider } from '@/lib/stabrix'
import { THEME_BOOT } from '@/lib/theme-boot'
import './globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Halcyon',
  description:
    'Liquidity that never leaves. One wallet balance makes stablecoin FX markets on Solana and 1inch Aqua and backs every stablecoin when one breaks.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const fonts = [sans, mono].map((f) => f.variable).join(' ')
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-dvh">
        <StabrixProvider>
          <AppShell>{children}</AppShell>
        </StabrixProvider>
        <Analytics />
      </body>
    </html>
  )
}
