import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'contracts', 'out')
const targets = [
  ['halcyonRouterAbi', 'HalcyonRouter.sol/HalcyonRouter.json'],
  ['halcyonBatchTakerAbi', 'HalcyonBatchTaker.sol/HalcyonBatchTaker.json'],
  ['halcyonExtructionAbi', 'HalcyonExtruction.sol/HalcyonExtruction.json'],
  ['halcyonBackstopAbi', 'HalcyonBackstop.sol/HalcyonBackstop.json'],
  ['halcyonLensAbi', 'HalcyonLens.sol/HalcyonLens.json'],
  ['halcyonOracleAbi', 'HalcyonOracle.sol/HalcyonOracle.json'],
  ['aquaAbi', 'Aqua.sol/Aqua.json'],
  ['mockStablecoinAbi', 'MockStablecoin.sol/MockStablecoin.json'],
]
const errorSources = [
  'HalcyonMath.sol/HalcyonMath.json',
  'HalcyonPricing.sol/HalcyonPricing.json',
  'HalcyonConfig.sol/HalcyonConfig.json',
  'HalcyonBackstopPricing.sol/HalcyonBackstopPricing.json',
  'HalcyonBackstopConfig.sol/HalcyonBackstopConfig.json',
  'HalcyonOracle.sol/HalcyonOracle.json',
]

const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))
const libErrors = errorSources.flatMap((p) => read(p).abi.filter((x) => x.type === 'error'))

const out = targets.map(([name, path]) => {
  let abi = read(path).abi
  if (name === 'halcyonRouterAbi' || name === 'halcyonBatchTakerAbi') {
    const seen = new Set(abi.filter((x) => x.type === 'error').map((x) => x.name))
    abi = [...abi, ...libErrors.filter((e) => !seen.has(e.name) && seen.add(e.name))]
  }
  return `export const ${name} = ${JSON.stringify(abi)} as const\n`
})
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'abi.ts'), out.join('\n'))
console.log(`wrote ${targets.length} abis`)
