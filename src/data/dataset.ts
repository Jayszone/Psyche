import type { CategoryMeta, Evidence, RawNode, RegionMeta, RelationType, Reference } from '../graph/types'

/**
 * Curated MOCK dataset. Relationships are illustrative hypotheses written for the
 * prototype. They are not research findings and the evidence labels are not calibrated.
 * To replace it, implement GraphRepository (src/graph/repository.ts) and return your own graph.
 */

/** Regions are wide areas of the universe; each holds several constellations (categories). */
export const REGIONS: RegionMeta[] = [
  { id: 'power', name: 'Power & Money', center: [-80, 12, 28], members: ['politics', 'geopolitics', 'trade', 'economics', 'finance', 'history'] },
  { id: 'mind', name: 'Minds & Machines', center: [76, 40, -44], members: ['technology', 'ai', 'science', 'physics', 'mathematics', 'space'] },
  { id: 'life', name: 'Life & Health', center: [28, -60, 72], members: ['biology', 'medicine', 'healthcare', 'psychology', 'sociology'] },
  { id: 'earth', name: 'Earth & Sustenance', center: [-20, -36, -96], members: ['environment', 'climate', 'energy', 'agriculture', 'food', 'geography'] },
  { id: 'culture', name: 'Human Culture', center: [-48, 76, -28], members: ['culture', 'art', 'music', 'literature', 'philosophy', 'religion', 'education', 'media'] },
  { id: 'making', name: 'Making & Moving', center: [84, -28, 56], members: ['transportation', 'manufacturing', 'sports'] },
]

type CatDef = [CategoryMeta['id'], string, string, string]
const CAT_DEFS: CatDef[] = [
  ['politics', 'Politics', '#9984F5', 'Elections, governments and the rules they set.'],
  ['geopolitics', 'Geopolitics', '#7F8FFF', 'Power between states, alliances and borders.'],
  ['trade', 'International Trade', '#5BC8C9', 'Goods, tariffs, ships and ports.'],
  ['economics', 'Economics', '#74B9FF', 'Prices, wages, growth and policy.'],
  ['finance', 'Finance', '#92A9FF', 'Money, credit, markets and risk.'],
  ['history', 'History', '#9FAAC4', 'Turning points that still echo.'],
  ['technology', 'Technology', '#8EE3F2', 'Inventions and the systems built on them.'],
  ['ai', 'Artificial Intelligence', '#C3B0FF', 'Machines that learn, reason and generate.'],
  ['science', 'Science', '#B3B7FF', 'Discoveries and the way we test ideas.'],
  ['physics', 'Physics', '#7FA8FF', 'Matter, energy, space and time.'],
  ['mathematics', 'Mathematics', '#A0C4FF', 'Structure, proof and pattern.'],
  ['space', 'Space Exploration', '#D6C8FF', 'Rockets, satellites and the view from above.'],
  ['biology', 'Biology', '#7FDB9E', 'Living things and how they work.'],
  ['medicine', 'Medicine', '#F29BB5', 'Diagnosing, treating and preventing illness.'],
  ['healthcare', 'Healthcare', '#FFB3C7', 'Systems that deliver and pay for care.'],
  ['psychology', 'Psychology', '#E0A1E0', 'Minds, behaviour and feeling.'],
  ['sociology', 'Sociology', '#D8B4F0', 'Groups, institutions and social change.'],
  ['environment', 'Environment', '#6FD6A0', 'Oceans, forests and living systems.'],
  ['climate', 'Climate', '#6CC9D8', 'Weather over decades and what changes it.'],
  ['energy', 'Energy', '#F5A97F', 'Fuels, power grids and what drives them.'],
  ['agriculture', 'Agriculture', '#B8DC7A', 'Farming, soil, seeds and harvests.'],
  ['food', 'Food', '#F2A98C', 'What we grow, catch, cook and pay for.'],
  ['geography', 'Geography', '#86C7B0', 'Places, terrain and how they shape life.'],
  ['culture', 'Culture', '#E4A9E4', 'Taste, travel and shared ideas.'],
  ['art', 'Art', '#F5A3D0', 'Painting, design and visual imagination.'],
  ['music', 'Music', '#FFB28A', 'Sound, rhythm and performance.'],
  ['literature', 'Literature', '#C9B5E8', 'Stories, poems and the printed word.'],
  ['philosophy', 'Philosophy', '#B0B8E8', 'Questions about knowing, being and acting.'],
  ['religion', 'Religion', '#E8D5A8', 'Belief, ritual and sacred tradition.'],
  ['education', 'Education', '#9ED8F2', 'Teaching, learning and institutions.'],
  ['media', 'Media', '#F28FA8', 'News, broadcasting and online platforms.'],
  ['transportation', 'Transportation', '#8FB5D8', 'Ships, trains, planes and roads.'],
  ['manufacturing', 'Manufacturing', '#B7B2C9', 'Making things at scale.'],
  ['sports', 'Sports', '#8FE0C0', 'Competition, games and the bodies behind them.'],
]

/** Constellation centres: members of a region sit on a loose sphere around the region's centre. */
function buildCategories(): CategoryMeta[] {
  const out: CategoryMeta[] = []
  const rot: Record<string, number> = { power: 0.4, mind: 1.9, life: 3.1, earth: 4.4, culture: 5.5, making: 2.6 }
  for (const reg of REGIONS) {
    const m = reg.members.length
    reg.members.forEach((id, i) => {
      const def = CAT_DEFS.find((d) => d[0] === id)!
      const y = m === 1 ? 0 : 1 - (2 * (i + 0.5)) / m
      const rad = Math.sqrt(Math.max(0, 1 - y * y))
      const th = i * 2.399963 + rot[reg.id]
      const R = 34
      out.push({
        id, label: def[1], color: def[2], blurb: def[3], region: reg.id,
        center: [reg.center[0] + Math.cos(th) * rad * R, reg.center[1] + y * R * 0.85, reg.center[2] + Math.sin(th) * rad * R],
      })
    })
  }
  out.push({ id: 'user', label: 'Your events', color: '#E8EDF8', center: [0, 0, 0], blurb: 'Events you added yourself.', region: 'user' })
  return out
}
export const CATEGORIES: CategoryMeta[] = buildCategories()

export const RAW_NODES: RawNode[] = [
  // Politics
  { id: 'us-midterms', label: 'U.S. midterm elections', category: 'politics', importance: 0.95,
    description: 'Elections held halfway through a U.S. presidential term that decide control of Congress.',
    metadata: { Cycle: 'Every two years' } },
  { id: 'congress-balance', label: 'Shift in congressional balance', category: 'politics', importance: 0.55,
    description: 'A change in which party controls the House or Senate, and so which laws can pass.' },
  { id: 'energy-policy', label: 'Energy policy expectations', category: 'politics', importance: 0.5,
    description: 'What markets expect about drilling, permitting, subsidies and emissions rules.' },
  { id: 'sanctions', label: 'Sanctions regimes', category: 'politics', importance: 0.5,
    description: 'Restrictions on trade or finance with particular countries or sectors.' },

  // Trade
  { id: 'tariff-expectations', label: 'U.S. tariff and trade-policy expectations', category: 'trade', importance: 0.6,
    description: 'How likely new tariffs, exemptions or trade deals look to businesses and investors.' },
  { id: 'us-japan-trade', label: 'U.S.–Japan trade conditions', category: 'trade', importance: 0.5,
    description: 'The terms, volumes and prices of goods moving between the two economies.' },
  { id: 'japan-import-costs', label: "Japan's import costs", category: 'trade', importance: 0.65,
    description: 'What Japan pays, in yen, for food, fuel and raw materials it brings in.' },
  { id: 'shipping-costs', label: 'Global shipping costs', category: 'trade', importance: 0.55,
    description: 'Freight rates for containers and bulk cargo, driven by fuel, capacity and disruption.' },
  { id: 'port-congestion', label: 'Port congestion', category: 'trade', importance: 0.4,
    description: 'Queues of ships and boxes waiting to be unloaded, which delay and add cost.' },
  { id: 'red-sea', label: 'Red Sea shipping disruption', category: 'trade', importance: 0.45,
    description: 'Rerouting of ships around a conflict zone, lengthening voyages between Asia and Europe.' },

  // Economics
  { id: 'fiscal-rates', label: 'U.S. fiscal and interest-rate expectations', category: 'economics', importance: 0.6,
    description: 'Expectations about federal spending, deficits and how fast interest rates move.' },
  { id: 'usd-jpy', label: 'Dollar–yen exchange rate', category: 'economics', importance: 0.8,
    description: 'How many yen one U.S. dollar buys. A weaker yen raises the yen price of imports.' },
  { id: 'boj-policy', label: 'Bank of Japan policy', category: 'economics', importance: 0.55,
    description: "Japan's central bank decisions on interest rates and bond buying." },
  { id: 'oil-prices', label: 'Crude oil prices', category: 'economics', importance: 0.7,
    description: 'The world price of oil, which feeds into transport, heating and manufacturing.' },
  { id: 'gas-prices', label: 'Natural gas prices', category: 'economics', importance: 0.55,
    description: 'The price of gas for power, heating and as a raw material for fertilizer.' },
  { id: 'fertilizer', label: 'Fertilizer costs', category: 'economics', importance: 0.5,
    description: 'What farmers pay for nitrogen and other crop nutrients.' },
  { id: 'japan-wages', label: 'Japanese wage growth and labor shortage', category: 'economics', importance: 0.5,
    description: 'Rising pay and a shrinking workforce, felt strongly in restaurants and services.' },
  { id: 'japan-exports', label: "Japan's export economy", category: 'economics', importance: 0.5,
    description: 'Cars, machinery and electronics sold abroad, which shape demand for the yen.' },

  // Technology
  { id: 'transistor', label: 'Invention of the transistor', category: 'technology', importance: 0.7,
    description: 'The 1947 device that replaced vacuum tubes and made modern electronics possible.' },
  { id: 'semiconductors', label: 'Semiconductor industry', category: 'technology', importance: 0.65,
    description: 'The design and manufacture of the chips inside almost every modern machine.' },
  { id: 'ai-compute', label: 'AI compute demand', category: 'technology', importance: 0.65,
    description: 'The surge in processing power wanted for training and running AI models.' },
  { id: 'datacentre-power', label: 'Data-centre power demand', category: 'technology', importance: 0.5,
    description: 'Electricity used by the buildings full of servers that run online services and AI.' },
  { id: 'precision-ag', label: 'Precision agriculture', category: 'technology', importance: 0.45,
    description: 'Farming guided by satellite positioning, sensors and data.' },
  { id: 'gps', label: 'GPS and satellite navigation', category: 'technology', importance: 0.55,
    description: 'Positioning and timing signals from satellites, used by phones, ships, tractors and banks.' },

  // Science
  { id: 'solar-max', label: 'Solar cycle maximum', category: 'science', importance: 0.6,
    description: 'The roughly eleven-year peak in sunspots and solar eruptions.' },
  { id: 'geomagnetic-storms', label: 'Geomagnetic storms', category: 'science', importance: 0.5,
    description: "Disturbances in Earth's magnetic field caused by bursts of solar plasma." },
  { id: 'ocean-heat', label: 'Ocean heat uptake', category: 'science', importance: 0.45,
    description: 'The oceans absorb most of the extra heat trapped by greenhouse gases.' },
  { id: 'sci-revolution', label: 'The Scientific Revolution', category: 'science', importance: 0.6,
    description: 'The 16th and 17th century shift toward experiment, measurement and shared evidence.' },
  { id: 'quantum', label: 'Quantum mechanics', category: 'science', importance: 0.55,
    description: 'The physics of very small things, developed in the early 20th century.' },

  // Environment
  { id: 'el-nino', label: 'El Niño cycle', category: 'environment', importance: 0.7,
    description: 'A periodic warming of the tropical Pacific that shifts weather around the world.' },
  { id: 'marine-heatwaves', label: 'Marine heatwaves', category: 'environment', importance: 0.5,
    description: 'Spells of unusually warm sea water that stress fish, coral and kelp.' },
  { id: 'co2', label: 'Atmospheric CO₂', category: 'environment', importance: 0.7,
    description: 'The concentration of carbon dioxide in the air, which has risen since industrialization.' },
  { id: 'bluefin', label: 'Bluefin tuna stocks', category: 'environment', importance: 0.6,
    description: 'The population of the large, prized tuna used for the most expensive sushi.' },
  { id: 'anchovy', label: 'Peruvian anchovy catch', category: 'environment', importance: 0.45,
    description: "One of the world's largest fisheries, very sensitive to ocean temperature." },

  // Culture
  { id: 'sushi-boom', label: 'Global sushi boom', category: 'culture', importance: 0.55,
    description: "Sushi's spread from Japan to restaurants and supermarkets across the world." },
  { id: 'washoku', label: 'Washoku cultural recognition', category: 'culture', importance: 0.4,
    description: "The 2013 UNESCO listing of Japan's traditional cuisine as intangible heritage." },
  { id: 'japan-tourism', label: 'Inbound tourism to Japan', category: 'culture', importance: 0.55,
    description: 'Visitors who spend on food, lodging and travel, especially when the yen is weak.' },
  { id: 'literacy', label: 'Spread of literacy', category: 'culture', importance: 0.5,
    description: 'The growth of reading and writing beyond clergy and elites.' },

  // History
  { id: 'industrial-rev', label: 'The Industrial Revolution', category: 'history', importance: 0.8,
    description: 'The shift to machines, factories and fossil fuels that began in 18th century Britain.' },
  { id: 'fossil-era', label: 'The fossil-fuel era', category: 'history', importance: 0.6,
    description: 'Two centuries of economies powered by burning coal, then oil and gas.' },
  { id: 'printing-press', label: "Gutenberg's printing press", category: 'history', importance: 0.7,
    description: 'Movable-type printing in Europe from the 1450s, which made books cheap.' },
  { id: 'meiji', label: 'Opening of Japan (Meiji era)', category: 'history', importance: 0.5,
    description: 'The late 19th century rapid modernization that built Japan\'s industrial base.' },

  // Food
  { id: 'seafood-feed', label: 'Imported seafood and feed prices', category: 'food', importance: 0.55,
    description: 'What Japan pays for seafood, fish feed and other food inputs bought from abroad.' },
  { id: 'restaurant-costs', label: 'Restaurant input costs in Japan', category: 'food', importance: 0.6,
    description: 'Fish, rice, energy and labor costs that a sushi restaurant must cover.' },
  { id: 'sushi-prices', label: 'Sushi prices in Japan', category: 'food', importance: 0.95,
    description: 'What a diner pays for sushi, from conveyor-belt plates to omakase counters.' },
  { id: 'rice-prices', label: 'Rice prices', category: 'food', importance: 0.6,
    description: 'The price of the staple grain, set by harvests, costs and policy.' },
  { id: 'wheat-yields', label: 'Wheat yields', category: 'food', importance: 0.5,
    description: 'The harvest per hectare of wheat, affected by weather, nutrients and technique.' },
  { id: 'bread-prices', label: 'Bread prices', category: 'food', importance: 0.5,
    description: 'What shoppers pay for bread, which follows wheat, energy and wages.' },
  { id: 'salmon-feed', label: 'Farmed-fish feed costs', category: 'food', importance: 0.45,
    description: 'The cost of fishmeal and fish oil used to feed farmed salmon and other fish.' },
]

type E = [string, string, RelationType, Evidence, string, Reference[]?]

const E_RAW: E[] = [
  // The featured chain and its alternatives
  ['us-midterms', 'congress-balance', 'causes', 'strong', 'Midterm results decide which party controls each chamber of Congress.'],
  ['congress-balance', 'tariff-expectations', 'influences', 'plausible', 'A changed balance of power alters how likely new tariffs, or tariff rollbacks, become.'],
  ['congress-balance', 'fiscal-rates', 'influences', 'plausible', 'Control of Congress shapes expectations for federal spending, deficits and the pace of rate changes.'],
  ['congress-balance', 'energy-policy', 'influences', 'plausible', 'Divided government can shift the odds on energy, permitting and emissions rules.'],
  ['tariff-expectations', 'us-japan-trade', 'influences', 'plausible', 'Tariff expectations change how trade between the two countries is priced and planned.'],
  ['us-japan-trade', 'usd-jpy', 'correlates', 'speculative', 'Trade-balance expectations can nudge currency markets, though the effect is small and often swamped.'],
  ['fiscal-rates', 'usd-jpy', 'influences', 'strong', 'Rate and fiscal expectations are a major driver of dollar strength against the yen.'],
  ['boj-policy', 'usd-jpy', 'influences', 'strong', 'The gap between Bank of Japan and U.S. Federal Reserve policy is a main driver of the yen.'],
  ['japan-exports', 'usd-jpy', 'influences', 'strong', 'Export earnings and the trade balance shape demand for the yen.'],
  ['usd-jpy', 'japan-import-costs', 'drives', 'strong', 'A weaker yen makes everything Japan imports more expensive in yen.'],
  ['japan-import-costs', 'seafood-feed', 'drives', 'strong', 'Japan imports a large share of its seafood, fish feed and fuel.'],
  ['seafood-feed', 'restaurant-costs', 'drives', 'strong', 'Fish and other inputs are the largest cost for a sushi restaurant.'],
  ['restaurant-costs', 'sushi-prices', 'drives', 'strong', 'Restaurants pass part of higher input costs on to menu prices, usually with a lag.'],
  ['energy-policy', 'oil-prices', 'influences', 'plausible', 'Expectations about energy policy move oil and gas futures.'],
  ['sanctions', 'oil-prices', 'influences', 'strong', 'Sanctions on major producers change how much oil reaches markets.'],
  ['sanctions', 'gas-prices', 'influences', 'plausible', 'Restrictions on gas exporters tighten supply and lift prices.'],
  ['oil-prices', 'shipping-costs', 'drives', 'strong', 'Fuel is a large share of what it costs to move cargo by sea.'],
  ['shipping-costs', 'japan-import-costs', 'drives', 'strong', 'Freight costs are added to the price of imported goods.'],
  ['red-sea', 'shipping-costs', 'drives', 'strong', 'Longer routes around a conflict zone raise freight rates.'],
  ['red-sea', 'port-congestion', 'influences', 'plausible', 'Bunched-up arrivals after rerouting can clog ports.'],
  ['port-congestion', 'shipping-costs', 'drives', 'plausible', 'Ships waiting at port reduce effective capacity and push rates up.'],
  ['japan-wages', 'restaurant-costs', 'influences', 'plausible', 'Higher pay raises the labor part of restaurant costs.'],
  ['japan-wages', 'sushi-prices', 'influences', 'plausible', 'A labor shortage pushes chains and counters to raise prices.'],
  ['japan-tourism', 'sushi-prices', 'influences', 'plausible', 'Visitor demand lets popular sushi restaurants charge more.'],
  ['usd-jpy', 'japan-tourism', 'influences', 'plausible', 'A weak yen makes Japan cheaper for foreign visitors.'],
  ['washoku', 'sushi-boom', 'influences', 'plausible', 'Cultural recognition fuels international interest in Japanese cuisine.'],
  ['washoku', 'japan-tourism', 'influences', 'plausible', 'Food culture is a reason many travelers choose Japan.'],
  ['sushi-boom', 'bluefin', 'influences', 'strong', 'Rising worldwide demand has increased fishing pressure on bluefin tuna.',
    [{ title: 'Illustrative: fisheries management reports on Atlantic and Pacific bluefin', note: 'Mock reference. Verify before relying on it.' }]],
  ['bluefin', 'seafood-feed', 'influences', 'plausible', 'Tight tuna supply limits what restaurants can source and lifts prices.'],
  ['bluefin', 'sushi-prices', 'influences', 'plausible', 'Scarcer prized fish raise ingredient costs at the top end of the market.'],

  // Climate and ocean routes
  ['el-nino', 'marine-heatwaves', 'influences', 'strong', 'El Niño years change ocean temperatures across the Pacific.'],
  ['el-nino', 'anchovy', 'causes', 'strong', 'Warm water off Peru can collapse the anchovy catch.',
    [{ title: 'Illustrative: NOAA Climate Prediction Center ENSO diagnostics', note: 'Mock reference. Verify before relying on it.' }]],
  ['anchovy', 'salmon-feed', 'drives', 'strong', 'Anchovy is the main raw material for fishmeal used in fish feed.'],
  ['salmon-feed', 'seafood-feed', 'influences', 'plausible', 'Dearer feed raises the cost of farmed fish sold to Japan.'],
  ['marine-heatwaves', 'bluefin', 'influences', 'plausible', 'Warm spells shift where tuna feed, migrate and spawn.'],
  ['el-nino', 'wheat-yields', 'influences', 'plausible', 'El Niño shifts rainfall in major grain regions.'],
  ['solar-max', 'el-nino', 'correlates', 'speculative', 'Some researchers have proposed links between solar activity and ocean cycles. The idea is debated.'],
  ['co2', 'ocean-heat', 'causes', 'strong', 'More greenhouse gas traps more heat, and most of it ends up in the ocean.'],
  ['ocean-heat', 'marine-heatwaves', 'causes', 'strong', 'A warmer baseline makes extreme warm spells more frequent.'],
  ['fossil-era', 'co2', 'causes', 'strong', 'Burning coal, oil and gas releases carbon dioxide.',
    [{ title: 'Illustrative: IPCC assessment reports, working group I', note: 'Mock reference. Verify before relying on it.' }]],

  // Technology and energy routes
  ['quantum', 'transistor', 'enables', 'strong', 'Understanding electrons in solids made the transistor possible.'],
  ['transistor', 'semiconductors', 'enables', 'strong', 'The transistor is the building block of the chip industry.'],
  ['semiconductors', 'ai-compute', 'enables', 'strong', 'Advanced chips are what make large-scale AI training practical.'],
  ['ai-compute', 'datacentre-power', 'drives', 'strong', 'More computing means more electricity in data centres.'],
  ['datacentre-power', 'gas-prices', 'influences', 'plausible', 'Gas-fired plants supply much new power demand, which tightens gas markets in some regions.'],
  ['gas-prices', 'fertilizer', 'drives', 'strong', 'Natural gas is the main feedstock for nitrogen fertilizer.'],
  ['oil-prices', 'gas-prices', 'correlates', 'plausible', 'Energy markets often move together, though not in lockstep.'],
  ['fertilizer', 'rice-prices', 'influences', 'plausible', 'Fertilizer is a notable part of the cost of growing rice.'],
  ['fertilizer', 'wheat-yields', 'influences', 'plausible', 'Affordable nutrients help yields. Costly ones can mean less is applied.'],
  ['rice-prices', 'sushi-prices', 'drives', 'plausible', 'Rice is a core ingredient, though a modest share of the final price.'],
  ['restaurant-costs', 'rice-prices', 'correlates', 'speculative', 'Restaurant buying patterns may add to rice demand, though the link is weak.'],

  // Space weather route
  ['solar-max', 'geomagnetic-storms', 'causes', 'strong', 'Solar eruptions send plasma toward Earth and disturb its magnetic field.'],
  ['geomagnetic-storms', 'gps', 'influences', 'strong', 'Storms can degrade satellite signals and positioning accuracy.'],
  ['gps', 'precision-ag', 'enables', 'strong', 'Guided tractors and field mapping depend on satellite positioning.'],
  ['precision-ag', 'wheat-yields', 'influences', 'plausible', 'Precise seeding and spraying can lift yields and cut waste.'],
  ['wheat-yields', 'bread-prices', 'drives', 'strong', 'Flour is the main ingredient of bread, so harvests feed into prices.'],

  // History routes
  ['printing-press', 'literacy', 'enables', 'strong', 'Cheap books made reading worth learning for far more people.'],
  ['literacy', 'sci-revolution', 'enables', 'plausible', 'Shared printed results let ideas be tested and built on across borders.'],
  ['sci-revolution', 'industrial-rev', 'enables', 'plausible', 'Experimental habits and engineering knowledge fed early industry.'],
  ['sci-revolution', 'quantum', 'enables', 'plausible', 'Modern physics grew from the tradition of measurement and theory.'],
  ['industrial-rev', 'fossil-era', 'enables', 'strong', 'Factories and railways ran on coal, locking in a fossil-fuel economy.'],
  ['meiji', 'japan-exports', 'enables', 'strong', 'Rapid industrialization built the base of Japanese manufacturing and trade.'],
  ['industrial-rev', 'meiji', 'influences', 'plausible', 'Western industrial methods were a model for Japan\'s modernization.'],
  ['sushi-boom', 'japan-tourism', 'correlates', 'speculative', 'Global fame of the food may add to travelers\' interest in visiting Japan.'],
]

export const RAW_EDGES = E_RAW.map(([source, target, type, evidence, description, references], i) => ({
  id: `e${i + 1}`, source, target, type, evidence, description, references,
}))

export interface DemoPair { id: string; from: string; to: string; title: string; blurb: string; featured?: boolean; /** Prefer the route that passes through this node. */ via?: string }

export const DEMO_PAIRS: DemoPair[] = [
  { id: 'featured', from: 'us-midterms', to: 'sushi-prices', featured: true, via: 'japan-import-costs',
    title: 'U.S. midterm elections to sushi prices in Japan',
    blurb: 'A hypothetical chain through policy expectations, currency and import costs.' },
  { id: 'press-tuna', from: 'printing-press', to: 'bluefin',
    title: "Gutenberg's printing press to bluefin tuna",
    blurb: 'Five centuries from movable type to the state of an ocean fish.' },
  { id: 'transistor-rice', from: 'transistor', to: 'rice-prices',
    title: 'The transistor to rice prices',
    blurb: 'From chips to AI to power demand to fertilizer.' },
  { id: 'sun-bread', from: 'solar-max', to: 'bread-prices',
    title: 'Solar storms to bread prices',
    blurb: 'A burst of plasma, a lost satellite signal, a tractor off course.' },
  { id: 'elnino-sushi', from: 'el-nino', to: 'sushi-prices',
    title: 'El Niño to sushi prices',
    blurb: 'Warm water off Peru, fish feed and a plate of nigiri.' },
]
