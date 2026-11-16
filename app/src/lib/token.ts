import { PublicKey } from '@solana/web3.js'

const key = (v: string | undefined) => {
  try {
    return v && v.trim() ? new PublicKey(v.trim()) : null
  } catch {
    return null
  }
}

export const TOKEN = {
  ticker: 'PEGLO',
  mint: key(process.env.NEXT_PUBLIC_PEGLO_MINT),
  stakeWallet: key(process.env.NEXT_PUBLIC_STAKE_WALLET),
  pair: process.env.NEXT_PUBLIC_DEXSCREENER_PAIR?.trim() || null,
}

export const TOKEN_LIVE = TOKEN.mint !== null && TOKEN.stakeWallet !== null

export const tokenLinks = (mint: string) => ({
  dexscreener: `https://dexscreener.com/solana/${TOKEN.pair ?? mint}`,
  pumpfun: `https://pump.fun/coin/${mint}`,
  gmgn: `https://gmgn.ai/sol/token/${mint}`,
  solscan: `https://solscan.io/token/${mint}`,
})

export const dexEmbed = (mint: string, dark: boolean) =>
  `https://dexscreener.com/solana/${TOKEN.pair ?? mint}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=${dark ? 'dark' : 'light'}&theme=${dark ? 'dark' : 'light'}&chartStyle=1&chartType=usd&interval=15`
