import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'contracts', 'out')
const targets = [
  ['pegloRouterAbi', 'PegloRouter.sol/PegloRouter.json'],
  ['pegloBatchTakerAbi', 'PegloBatchTaker.sol/PegloBatchTaker.json'],
  ['pegloExtructionAbi', 'PegloExtruction.sol/PegloExtruction.json'],
  ['pegloBackstopAbi', 'PegloBackstop.sol/PegloBackstop.json'],
  ['pegloLensAbi', 'PegloLens.sol/PegloLens.json'],
  ['pegloOracleAbi', 'PegloOracle.sol/PegloOracle.json'],
  ['aquaAbi', 'Aqua.sol/Aqua.json'],
  ['mockStablecoinAbi', 'MockStablecoin.sol/MockStablecoin.json'],
]
const errorSources = [
  'PegloMath.sol/PegloMath.json',
  'PegloPricing.sol/PegloPricing.json',
  'PegloConfig.sol/PegloConfig.json',
  'PegloBackstopPricing.sol/PegloBackstopPricing.json',
  'PegloBackstopConfig.sol/PegloBackstopConfig.json',
  'PegloOracle.sol/PegloOracle.json',
]

const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const libErrors = errorSources.flatMap((p) => read(p).abi.filter((x) => x.type === 'error'))

const out = targets.map(([name, path]) => {
  let abi = read(path).abi
  if (name === 'pegloRouterAbi' || name === 'pegloBatchTakerAbi') {
    const seen = new Set(abi.filter((x) => x.type === 'error').map((x) => x.name))
    abi = [...abi, ...libErrors.filter((e) => !seen.has(e.name) && seen.add(e.name))]
  }
  return `export const ${name} = ${JSON.stringify(abi)} as const\n`
})
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'abi.ts'), out.join('\n'))
console.log(`wrote ${targets.length} abis`)
