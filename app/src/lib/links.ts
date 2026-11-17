const env = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined)

export const LINKS = {
  x: env(process.env.NEXT_PUBLIC_X_URL),
  telegram: env(process.env.NEXT_PUBLIC_TELEGRAM_URL),
  discord: env(process.env.NEXT_PUBLIC_DISCORD_URL),
  github: env(process.env.NEXT_PUBLIC_GITHUB_URL),
  video: env(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL) ?? '/peglo-demo.mp4',
  ambassador: env(process.env.NEXT_PUBLIC_AMBASSADOR_URL),
  linkedin: env(process.env.NEXT_PUBLIC_LINKEDIN_URL),
  program: 'https://solscan.io/account/9yndJ2CVGSWr58nXNVS8rgkYFiiXghkchicSK5KjhABw',
}

export interface FooterLink {
  label: string
  href?: string
  external?: boolean
}

export const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Swap', href: '/swap' },
      { label: 'Liquidity', href: '/liquidity' },
      { label: 'Pool', href: '/pool' },
      { label: 'Activity', href: '/activity' },
      { label: 'Stake $PEGLO', href: '/stake' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Litepaper', href: '/litepaper' },
      { label: 'Pitch deck', href: '/deck' },
      { label: 'Demo video', href: LINKS.video, external: true },
    ],
  },
  {
    title: 'Build',
    links: [
      { label: 'GitHub', href: LINKS.github, external: true },
      { label: 'Solana program', href: LINKS.program, external: true },
      { label: 'Security', href: '/docs#security' },
      { label: 'Risks and limits', href: '/docs#limits' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'X', href: LINKS.x, external: true },
      { label: 'Telegram', href: LINKS.telegram, external: true },
      { label: 'Discord', href: LINKS.discord, external: true },
      { label: 'LinkedIn', href: LINKS.linkedin, external: true },
      { label: 'Ambassador program', href: LINKS.ambassador, external: true },
    ],
  },
]
