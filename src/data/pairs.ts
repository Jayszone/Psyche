import { DEMO_PAIRS, type DemoPair } from './dataset'

/** Demo journeys: the built-in ones plus any EXTRA_DEMO_PAIRS exported by src/data/universe*.ts. */
const packs = import.meta.glob<{ EXTRA_DEMO_PAIRS?: DemoPair[] }>('./universe*.ts', { eager: true })

const own: DemoPair[] = [
  { id: 'industrial-sushi', from: 'industrial-rev', to: 'sushi-prices', via: 'japan-tourism',
    title: 'The Industrial Revolution to sushi prices', blurb: 'From steam and rail to Meiji Japan, the yen and a plate of nigiri.' },
]

export const ALL_PAIRS: DemoPair[] = [
  ...DEMO_PAIRS,
  ...own,
  ...Object.values(packs).flatMap((m) => m.EXTRA_DEMO_PAIRS ?? []),
].filter((p, i, a) => a.findIndex((q) => q.id === p.id) === i)

export const FEATURED = ALL_PAIRS.find((p) => p.featured) ?? ALL_PAIRS[0]
