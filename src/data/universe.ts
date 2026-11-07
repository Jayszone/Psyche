import type { Evidence, RelationType } from '../graph/types'

/**
 * Hand-written MOCK expansion of the knowledge universe. Like dataset.ts, every relationship
 * here is an illustrative hypothesis for the prototype, not a research finding, and the
 * evidence labels are not calibrated. Existing node ids from dataset.ts are referenced freely.
 */

// [id, label, category, importance, description]
export type NodeTuple = [string, string, string, number, string]
// [sourceId, targetId, type, evidence, description]
export type EdgeTuple = [string, string, RelationType, Evidence, string]

export const EXTRA_NODES: NodeTuple[] = [
  // Geopolitics
  ['cold-war', 'The Cold War', 'geopolitics', 0.85, 'The decades-long rivalry between the United States and Soviet Union that shaped alliances, arms and science.'],
  ['nato', 'NATO', 'geopolitics', 0.4, 'The North Atlantic military alliance founded in 1949, built on mutual defence among its members.'],
  ['united-nations', 'United Nations', 'geopolitics', 0.6, 'The international body founded in 1945 to keep peace and coordinate work on health, trade and development.'],
  ['strait-of-hormuz', 'Strait of Hormuz', 'geopolitics', 0.35, 'A narrow sea passage at the mouth of the Persian Gulf through which a large share of the world\'s oil moves.'],

  // Politics
  ['european-union', 'European Union', 'politics', 0.65, 'A political and economic union of European states that shares a single market and many common rules.'],
  ['civil-rights-movement', 'U.S. civil rights movement', 'politics', 0.6, 'The mid-20th century campaign to end legal racial segregation and secure equal voting rights in the United States.'],

  // Trade
  ['wto', 'World Trade Organization', 'trade', 0.55, 'The body that sets and polices rules for trade between countries, successor to the post-war GATT.'],
  ['silk-road', 'Silk Road', 'trade', 0.35, 'The network of overland and sea routes that linked China, Central Asia and the Mediterranean for centuries.'],
  ['colonial-trade', 'Colonial trade networks', 'trade', 0.5, 'European-run commerce in sugar, cotton, spices and enslaved people that tied several continents together from the 1500s.'],

  // Economics
  ['inflation', 'Inflation', 'economics', 0.7, 'A general rise in prices over time, which erodes what a unit of money can buy.'],
  ['keynesianism', 'Keynesian economics', 'economics', 0.55, 'The view that governments can steady demand and employment through spending and taxes during downturns.'],
  ['behavioral-economics', 'Behavioral economics', 'economics', 0.35, 'The study of how habits, framing and bias lead real people to depart from textbook rational choice.'],

  // Finance
  ['bretton-woods', 'Bretton Woods system', 'finance', 0.7, 'The post-war arrangement that tied currencies to the U.S. dollar and created the IMF and World Bank.'],
  ['gold-standard', 'Gold standard', 'finance', 0.3, 'A monetary system in which currencies were fixed to a set weight of gold, common before the 1930s.'],
  ['financial-crisis-2008', 'Global financial crisis of 2008', 'finance', 0.7, 'A collapse in housing-linked credit that froze banks and led to a deep worldwide recession.'],
  ['bitcoin', 'Bitcoin and blockchain', 'finance', 0.5, 'A digital currency kept honest by a shared public ledger and cryptography rather than by a central bank.'],
  ['joint-stock-company', 'Joint-stock company', 'finance', 0.35, 'A business owned through tradable shares, which let many investors pool money for large ventures.'],

  // History
  ['world-war-2', 'World War II', 'history', 0.9, 'The global conflict of 1939 to 1945 that redrew borders, economies and institutions across the world.'],
  ['age-of-exploration', 'Age of Exploration', 'history', 0.55, 'The era from the 1400s when European ships mapped sea routes and linked distant continents.'],
  ['black-death', 'The Black Death', 'history', 0.4, 'The plague pandemic of the 1340s that killed a large share of Europe\'s people and reshaped its society.'],
  ['great-depression', 'The Great Depression', 'history', 0.6, 'The severe worldwide economic slump of the 1930s, marked by mass unemployment and failing banks.'],

  // Technology
  ['steam-engine', 'Steam engine', 'technology', 0.7, 'A machine that turns heat from burning fuel into motion, which powered mines, factories and trains.'],
  ['internet', 'The internet', 'technology', 0.92, 'The global network of networks that carries the web, email, streaming and most modern digital services.'],
  ['smartphone', 'Smartphones', 'technology', 0.6, 'Pocket computers with a screen, camera and constant connection, widespread since the late 2000s.'],
  ['refrigeration', 'Mechanical refrigeration', 'technology', 0.5, 'Machines that remove heat to keep things cold, which let perishable food be stored and shipped far.'],

  // AI
  ['machine-learning', 'Machine learning', 'ai', 0.85, 'Methods that let computers find patterns in data and improve at tasks without being explicitly programmed.'],
  ['neural-networks', 'Artificial neural networks', 'ai', 0.6, 'Layered mathematical models, loosely inspired by the brain, that learn to recognise patterns from examples.'],
  ['large-language-models', 'Large language models', 'ai', 0.7, 'AI systems trained on vast amounts of text that can write, summarise and answer questions in natural language.'],
  ['recommender-systems', 'Recommendation algorithms', 'ai', 0.35, 'Software that predicts what a person may want to watch, hear or buy from their past behaviour.'],

  // Science
  ['peer-review', 'Peer review', 'science', 0.3, 'The practice of having independent experts check research before it is published.'],
  ['telescope', 'The telescope', 'science', 0.4, 'An optical instrument that made distant objects visible and overturned old pictures of the heavens.'],

  // Physics
  ['relativity', 'Theory of relativity', 'physics', 0.8, 'Einstein\'s account of space, time and gravity, which changed how we model motion and the universe.'],
  ['electromagnetism', 'Electromagnetism', 'physics', 0.6, 'The unified physics of electricity, magnetism and light worked out in the 19th century.'],
  ['nuclear-fission', 'Nuclear fission', 'physics', 0.4, 'The splitting of heavy atoms, identified in 1938, which releases very large amounts of energy.'],
  ['thermodynamics', 'Thermodynamics', 'physics', 0.4, 'The science of heat, work and energy, which grew out of efforts to improve engines.'],

  // Mathematics
  ['calculus', 'Calculus', 'mathematics', 0.6, 'The mathematics of change and accumulation, developed in the 17th century by Newton and Leibniz.'],
  ['game-theory', 'Game theory', 'mathematics', 0.6, 'The mathematical study of strategic choices when the outcome depends on what others decide.'],
  ['public-key-cryptography', 'Public-key cryptography', 'mathematics', 0.5, 'Encryption in which anyone can lock a message with a public key but only the owner can unlock it.'],
  ['statistics', 'Statistics and probability', 'mathematics', 0.6, 'The mathematics of uncertainty, sampling and inference that underpins modern science and data analysis.'],

  // Space
  ['apollo-program', 'Apollo program', 'space', 0.8, 'The U.S. programme that landed astronauts on the Moon between 1969 and 1972.'],
  ['sputnik', 'Sputnik 1', 'space', 0.4, 'The Soviet satellite launched in 1957 that began the space age and alarmed the United States.'],
  ['communications-satellites', 'Communications satellites', 'space', 0.4, 'Orbiting relays that carry telephone, television and data signals across oceans and continents.'],
  ['reusable-rockets', 'Reusable rockets', 'space', 0.35, 'Launch vehicles that land and fly again, which has lowered the cost of reaching orbit.'],

  // Biology
  ['evolution', 'Theory of evolution', 'biology', 0.8, 'Darwin and Wallace\'s account of how species change over generations through natural selection.'],
  ['dna-structure', 'Structure of DNA', 'biology', 0.65, 'The double-helix model of 1953 that explained how genetic information is stored and copied.'],
  ['crispr', 'CRISPR gene editing', 'biology', 0.55, 'A tool adapted from bacteria that lets scientists cut and change DNA at chosen locations.'],
  ['microbiome', 'Human microbiome', 'biology', 0.25, 'The trillions of microbes living in and on the body, which influence digestion and immunity.'],

  // Medicine
  ['penicillin', 'Penicillin', 'medicine', 0.65, 'The first widely used antibiotic, discovered in 1928 and mass-produced during the 1940s.'],
  ['vaccination', 'Vaccination', 'medicine', 0.8, 'Training the immune system with a harmless form of a germ to prevent serious disease.'],
  ['germ-theory', 'Germ theory of disease', 'medicine', 0.6, 'The finding that specific microbes cause specific diseases, which transformed hygiene and treatment.'],
  ['covid-pandemic', 'COVID-19 pandemic', 'medicine', 0.7, 'The global outbreak of a novel coronavirus from 2020 that disrupted health, travel and economies.'],
  ['antibiotic-resistance', 'Antibiotic resistance', 'medicine', 0.4, 'Bacteria evolving to survive drugs that once killed them, which makes some infections harder to treat.'],

  // Healthcare
  ['universal-healthcare', 'Universal healthcare', 'healthcare', 0.5, 'Systems that aim to give everyone access to medical care, usually funded through taxes or mandatory insurance.'],
  ['life-expectancy', 'Rising life expectancy', 'healthcare', 0.6, 'The long-run increase in how many years people can expect to live, especially since the 1800s.'],
  ['public-sanitation', 'Public sanitation and clean water', 'healthcare', 0.45, 'Sewers, treated water and waste collection that cut the spread of infectious disease in cities.'],
  ['health-insurance', 'Health insurance', 'healthcare', 0.3, 'Pooled payments that spread the cost of medical care across many people.'],

  // Psychology
  ['cognitive-biases', 'Cognitive biases', 'psychology', 0.4, 'Systematic mental shortcuts that can pull judgement away from what a plain reading of the facts suggests.'],
  ['psychoanalysis', 'Psychoanalysis', 'psychology', 0.35, 'Freud\'s approach to the unconscious mind, which shaped therapy and 20th century culture.'],
  ['behaviorism', 'Behaviorism', 'psychology', 0.3, 'A school of psychology that explains behaviour through rewards, punishments and conditioning.'],

  // Sociology
  ['urbanization', 'Urbanization', 'sociology', 0.65, 'The movement of people from farms and villages into towns and cities.'],
  ['demographic-transition', 'Demographic transition', 'sociology', 0.6, 'The shift from high birth and death rates to low ones as societies grow wealthier and healthier.'],
  ['inequality', 'Economic inequality', 'sociology', 0.6, 'The uneven spread of income and wealth within and between societies.'],
  ['womens-labour-participation', 'Women\'s entry into paid work', 'sociology', 0.5, 'The long rise in the share of women holding paid jobs, which changed households and economies.'],

  // Environment
  ['deforestation', 'Deforestation', 'environment', 0.4, 'The clearing of forests for farmland, timber and development.'],
  ['plastic-pollution', 'Plastic pollution', 'environment', 0.3, 'Plastic waste that persists in rivers, oceans and soil and breaks into tiny fragments.'],

  // Climate
  ['global-warming', 'Global warming', 'climate', 0.9, 'The rise in average world temperatures since the 1800s, driven mainly by human greenhouse gas emissions.'],
  ['greenhouse-effect', 'Greenhouse effect', 'climate', 0.55, 'The trapping of heat by gases such as carbon dioxide and water vapour in the atmosphere.'],
  ['paris-agreement', 'Paris Agreement', 'climate', 0.4, 'The 2015 pact in which nearly all countries pledged to limit warming through national climate targets.'],
  ['sea-level-rise', 'Sea-level rise', 'climate', 0.4, 'Higher oceans from melting ice and warming water, which threatens low-lying coasts and ports.'],
  ['extreme-weather', 'Extreme weather events', 'climate', 0.4, 'Heatwaves, floods, droughts and storms whose frequency and intensity shift as the climate warms.'],

  // Energy
  ['electrification', 'Electrification', 'energy', 0.85, 'The spread of electric power to homes, factories and transport from the late 1800s onward.'],
  ['nuclear-power', 'Nuclear power', 'energy', 0.55, 'Electricity generated from the heat of controlled fission reactions, with low direct carbon emissions.'],
  ['solar-pv', 'Solar photovoltaics', 'energy', 0.6, 'Panels that turn sunlight directly into electricity, whose costs have fallen steadily for decades.'],
  ['li-ion-batteries', 'Lithium-ion batteries', 'energy', 0.4, 'Rechargeable cells that power phones, laptops and electric vehicles and can store grid electricity.'],
  ['oil-crisis-1973', 'The 1973 oil crisis', 'energy', 0.4, 'An oil embargo and price spike that exposed how dependent industrial economies were on imported crude.'],
  ['energy-transition', 'Energy transition', 'energy', 0.7, 'The gradual shift from fossil fuels toward renewables, electrification and low-carbon power.'],

  // Agriculture
  ['green-revolution', 'Green Revolution', 'agriculture', 0.85, 'Mid-20th century breeding of high-yield crops, paired with fertilizer and irrigation, that raised harvests.'],
  ['haber-bosch', 'Haber-Bosch process', 'agriculture', 0.8, 'The early 1900s method of making ammonia from air and natural gas, the basis of synthetic fertilizer.'],
  ['crop-domestication', 'Domestication of crops', 'agriculture', 0.6, 'The ancient selection of wild grasses and plants into wheat, rice and maize that began settled farming.'],
  ['mechanized-farming', 'Mechanized farming', 'agriculture', 0.4, 'Tractors and harvesters that replaced much human and animal labour in the fields.'],
  ['aquaculture', 'Aquaculture', 'agriculture', 0.35, 'The farming of fish, shellfish and seaweed, now a major source of the seafood people eat.'],

  // Food
  ['cold-chain', 'The cold chain', 'food', 0.35, 'The unbroken run of refrigerated storage and transport that keeps perishable food fresh from source to shop.'],
  ['supermarkets', 'Supermarkets', 'food', 0.3, 'Large self-service stores that centralised food retail and changed how people shop and what they eat.'],

  // Geography
  ['cartography', 'Cartography', 'geography', 0.35, 'The making of maps, which guided navigation, trade, war and the planning of states.'],
  ['ring-of-fire', 'Pacific Ring of Fire', 'geography', 0.3, 'The belt of volcanoes and fault lines around the Pacific, including Japan, where many earthquakes occur.'],
  ['natural-harbours', 'Natural deep-water harbours', 'geography', 0.25, 'Sheltered coastal inlets that let large ships dock, helping some cities grow into trading hubs.'],

  // Culture
  ['globalization', 'Cultural globalization', 'culture', 0.65, 'The spread of food, media, fashion and ideas across borders as trade and travel grew.'],
  ['anime-manga', 'Anime and manga', 'culture', 0.4, 'Japanese animation and comics that became a worldwide cultural export.'],
  ['soft-power', 'Soft power', 'culture', 0.3, 'A country\'s ability to attract others through culture, values and example rather than force.'],
  ['youth-culture', 'Youth culture', 'culture', 0.25, 'Music, fashion and habits that young people developed as a distinct social group in the 20th century.'],

  // Art
  ['renaissance', 'The Renaissance', 'art', 0.7, 'The European revival of art, learning and inquiry from the 14th to 17th centuries.'],
  ['impressionism', 'Impressionism', 'art', 0.4, 'The 19th century painting movement that caught fleeting light and everyday scenes in loose brushwork.'],
  ['ukiyo-e', 'Ukiyo-e woodblock prints', 'art', 0.35, 'Japanese prints of the Edo period showing actors, landscapes and city life, widely collected abroad.'],
  ['photography', 'Photography', 'art', 0.55, 'Capturing images with light, invented in the 1800s, which changed art, news and memory.'],

  // Music
  ['jazz', 'Jazz', 'music', 0.55, 'A genre born in early 20th century African American communities, built on improvisation and syncopated rhythm.'],
  ['rock-and-roll', 'Rock and roll', 'music', 0.4, 'The 1950s popular music that blended rhythm and blues, country and amplified guitars.'],
  ['sound-recording', 'Sound recording', 'music', 0.55, 'Capturing and replaying sound, from the phonograph of the 1870s to modern digital audio.'],
  ['streaming-music', 'Spotify and music streaming', 'music', 0.35, 'On-demand music delivered over the internet, which replaced much buying of discs and downloads.'],

  // Literature
  ['writing-systems', 'Invention of writing', 'literature', 0.75, 'The first scripts, which let records, laws and stories outlast the memory of a single person.'],
  ['the-novel', 'The novel', 'literature', 0.4, 'Long prose fiction that rose in popularity from the 1700s alongside printing and growing literacy.'],
  ['science-fiction', 'Science fiction', 'literature', 0.35, 'Stories that imagine future technology and society, and sometimes inspire real inventors.'],
  ['haiku', 'Haiku', 'literature', 0.2, 'A compact Japanese poem form of seventeen sound units, shaped by Zen thought and Edo-era culture.'],

  // Philosophy
  ['greek-philosophy', 'Ancient Greek philosophy', 'philosophy', 0.6, 'Thinkers such as Socrates, Plato and Aristotle who set out early methods of argument and inquiry.'],
  ['enlightenment', 'The Enlightenment', 'philosophy', 0.85, 'The 18th century movement that prized reason, science and individual rights over inherited authority.'],
  ['social-contract', 'Social contract theory', 'philosophy', 0.35, 'The idea that legitimate government rests on an agreement among the people it governs.'],
  ['marxism', 'Marxism', 'philosophy', 0.4, 'A body of thought that analyses history and politics through class struggle and ownership of production.'],
  ['formal-logic', 'Formal logic', 'philosophy', 0.3, 'The study of valid reasoning through precise rules, from Aristotle\'s syllogisms to symbolic systems.'],

  // Religion
  ['reformation', 'Protestant Reformation', 'religion', 0.6, 'The 16th century religious upheaval that split Western Christianity and challenged church authority.'],
  ['buddhism', 'Buddhism', 'religion', 0.45, 'A tradition founded in India that spread across Asia and shaped art, ethics and daily life.'],
  ['zen-buddhism', 'Zen Buddhism', 'religion', 0.25, 'A school of Buddhism emphasising meditation, which strongly influenced Japanese arts and manners.'],
  ['secularization', 'Secularization', 'religion', 0.3, 'The decline in the public and political role of religion in many societies.'],

  // Education
  ['universities', 'Medieval universities', 'education', 0.4, 'Self-governing communities of scholars that began in Europe around the 12th century and spread worldwide.'],
  ['public-schooling', 'Public schooling', 'education', 0.5, 'State-funded schools open to all children, which became common in the 19th century.'],
  ['online-learning', 'Online learning', 'education', 0.3, 'Courses and lessons delivered over the internet, used far more widely during the 2020 school closures.'],

  // Media
  ['newspapers', 'Newspapers', 'media', 0.4, 'Regular printed news sheets that built a shared public conversation from the 17th century.'],
  ['radio', 'Radio broadcasting', 'media', 0.55, 'Wireless transmission of speech and music to mass audiences from the 1920s.'],
  ['television', 'Television', 'media', 0.65, 'Broadcast moving pictures that became the main shared medium of the mid-20th century.'],
  ['social-media', 'Social media', 'media', 0.7, 'Online platforms where people share posts and follow each other, reshaping news and debate.'],
  ['advertising', 'Advertising', 'media', 0.4, 'Paid persuasion that funds much of the media and shapes consumer taste.'],
  ['search-engines', 'Search engines', 'media', 0.4, 'Services that index the web and rank pages, which became the main way people find information.'],

  // Transportation
  ['railways', 'Railways', 'transportation', 0.7, 'Steam and later electric trains that sped up travel and trade from the early 1800s.'],
  ['automobile', 'The automobile', 'transportation', 0.8, 'The motor car, which reshaped cities, work and leisure in the 20th century.'],
  ['commercial-aviation', 'Commercial aviation', 'transportation', 0.6, 'Scheduled passenger flights, which made long-distance travel fast and affordable for many.'],
  ['container-shipping', 'Container shipping', 'transportation', 0.7, 'Standard steel boxes moved by ship, train and truck, which cut the cost of handling freight.'],
  ['suez-canal', 'Suez Canal', 'transportation', 0.4, 'The Egyptian waterway opened in 1869 that links the Mediterranean and Red Seas, shortening Europe-Asia voyages.'],
  ['shinkansen', 'Shinkansen bullet train', 'transportation', 0.35, 'Japan\'s high-speed rail network, opened in 1964 and known for its speed and punctuality.'],

  // Manufacturing
  ['fordism', 'Assembly line and Fordism', 'manufacturing', 0.65, 'Moving-line mass production, popularised by Ford, that made goods cheap and workers into customers.'],
  ['toyota-production-system', 'Toyota Production System', 'manufacturing', 0.4, 'A lean method of cutting waste and making only what is needed, adopted by manufacturers worldwide.'],
  ['automation-robotics', 'Industrial automation and robotics', 'manufacturing', 0.4, 'Machines and robots that carry out factory tasks once done by hand.'],
  ['global-supply-chains', 'Global supply chains', 'manufacturing', 0.65, 'Networks in which parts and goods are made in many countries before reaching the buyer.'],
  ['textile-mills', 'Mechanized textile mills', 'manufacturing', 0.35, 'Factories with powered spinning and weaving machines that launched industrial production in Britain.'],

  // Sports
  ['olympics', 'Modern Olympic Games', 'sports', 0.65, 'The international multi-sport event revived in 1896, now a stage for national pride and global media.'],
  ['football', 'Association football', 'sports', 0.4, 'The world\'s most widely played team sport, organised globally through national leagues and the World Cup.'],
  ['baseball', 'Baseball', 'sports', 0.3, 'A bat-and-ball sport that grew from American roots into a mainstay in Japan, Korea and Latin America.'],
  ['sports-analytics', 'Sports analytics', 'sports', 0.2, 'The use of data and statistics to evaluate players and guide tactics and recruitment.'],
]

export const EXTRA_EDGES: EdgeTuple[] = [
  // Writing, philosophy, printing and the growth of knowledge
  ['writing-systems', 'literacy', 'enables', 'strong', 'Written scripts made reading a learnable skill, which later spread well beyond scribes and elites.'],
  ['crop-domestication', 'writing-systems', 'enables', 'speculative', 'Counting grain stores and debts is one commonly proposed origin of early writing.'],
  ['greek-philosophy', 'formal-logic', 'influences', 'strong', 'Aristotle\'s study of syllogisms laid the first systematic foundation for rules of valid reasoning.'],
  ['greek-philosophy', 'sci-revolution', 'influences', 'plausible', 'Ancient ideas about nature gave early modern thinkers positions to test, refine or overturn.'],
  ['formal-logic', 'neural-networks', 'influences', 'speculative', 'Early neural models were framed as networks of simple logical units, linking symbolic reasoning to learning machines.'],
  ['renaissance', 'sci-revolution', 'enables', 'strong', 'Renaissance humanism and workshop craft encouraged observation, anatomy and the mathematical study of nature.'],
  ['printing-press', 'renaissance', 'enables', 'plausible', 'Printed editions spread classical texts and new ideas faster than hand copying ever could.'],
  ['reformation', 'literacy', 'drives', 'plausible', 'The emphasis on reading scripture personally gave many communities a reason to teach reading.'],
  ['reformation', 'industrial-rev', 'correlates', 'speculative', 'Weber\'s thesis, still debated, links Protestant work ethics to habits that later suited industrial capitalism.'],
  ['literacy', 'the-novel', 'enables', 'plausible', 'Wider reading ability, especially among women and the middle classes, supplied the readers fiction needed.'],
  ['sci-revolution', 'enlightenment', 'influences', 'plausible', 'The success of Newton\'s physics encouraged the belief that reason could also improve society.'],
  ['sci-revolution', 'calculus', 'enables', 'strong', 'The new focus on motion and measurement drove the invention of calculus.'],
  ['telescope', 'cartography', 'influences', 'plausible', 'Astronomical observation improved the fixing of latitude and longitude that accurate maps need.'],
  ['telescope', 'relativity', 'influences', 'speculative', 'Astronomical observations later offered key tests of general relativity, such as starlight bending near the Sun.'],
  ['universities', 'sci-revolution', 'enables', 'plausible', 'Universities gave scholars institutions, libraries and students that sustained long-term inquiry.'],
  ['universities', 'peer-review', 'enables', 'plausible', 'Academic communities developed norms of examining and critiquing each other\'s work.'],
  ['enlightenment', 'social-contract', 'influences', 'strong', 'Enlightenment writers refined ideas of government by consent and natural rights.'],
  ['enlightenment', 'marxism', 'influences', 'plausible', 'Marx drew on Enlightenment ideas of progress and critique when analysing society.'],
  ['enlightenment', 'newspapers', 'influences', 'plausible', 'Coffeehouse debate and pamphlet culture grew into a public sphere that newspapers served.'],
  ['social-contract', 'us-midterms', 'influences', 'plausible', 'The idea that rulers answer to the governed underlies competitive elections such as the U.S. midterms.'],
  ['marxism', 'cold-war', 'drives', 'plausible', 'The ideological contest between communist and capitalist systems was at the core of the rivalry.'],

  // Evolution, life, medicine and health
  ['evolution', 'cognitive-biases', 'influences', 'speculative', 'Many mental shortcuts are thought to be adaptations that worked well in ancestral environments.'],
  ['evolution', 'secularization', 'influences', 'speculative', 'Darwin\'s account challenged literal readings of creation, though its effect on belief varied widely.'],
  ['evolution', 'dna-structure', 'influences', 'speculative', 'Seeing inheritance as the engine of evolution made the physical basis of genes a central question.'],
  ['quantum', 'dna-structure', 'influences', 'plausible', 'Quantum-era physics and X-ray diffraction methods revealed molecular structures, including the double helix.'],
  ['crispr', 'aquaculture', 'influences', 'speculative', 'Gene editing is being explored as a way to make farmed fish hardier and faster growing.'],
  ['crispr', 'wheat-yields', 'influences', 'speculative', 'Edited crops may be bred for drought tolerance and yield, though field results are still emerging.'],
  ['microbiome', 'antibiotic-resistance', 'influences', 'plausible', 'Gut bacteria can exchange resistance genes, so the microbiome is both a reservoir and a barrier.'],
  ['penicillin', 'microbiome', 'influences', 'plausible', 'Antibiotics can disturb the community of bacteria living in the gut.'],
  ['germ-theory', 'public-sanitation', 'enables', 'strong', 'Once microbes were linked to disease, clean water and sewage treatment became public priorities.'],
  ['vaccination', 'germ-theory', 'influences', 'plausible', 'Pasteur\'s work on vaccines helped establish that specific microbes cause specific diseases.'],
  ['united-nations', 'vaccination', 'influences', 'plausible', 'UN agencies coordinate immunisation campaigns, including the smallpox eradication effort.'],
  ['public-sanitation', 'life-expectancy', 'drives', 'strong', 'Cleaner water and sewers cut deaths from cholera, typhoid and other infections.'],
  ['black-death', 'public-sanitation', 'influences', 'speculative', 'Plague outbreaks led cities to try quarantine, inspection and waste rules, early forms of public health.'],
  ['silk-road', 'black-death', 'influences', 'speculative', 'Long-distance trade routes are thought to have helped plague travel between Asia and Europe.'],
  ['life-expectancy', 'demographic-transition', 'drives', 'strong', 'Falling death rates are the first phase of the demographic transition.'],
  ['universal-healthcare', 'life-expectancy', 'influences', 'plausible', 'Broad access to care is associated with better outcomes, though many other factors matter.'],
  ['world-war-2', 'universal-healthcare', 'influences', 'plausible', 'Post-war governments, such as Britain with its NHS, expanded health systems as part of a new social settlement.'],
  ['health-insurance', 'inequality', 'influences', 'plausible', 'Who is covered, and how well, affects financial risk across income groups.'],
  ['covid-pandemic', 'port-congestion', 'causes', 'plausible', 'Surging goods demand and labour shortages created long queues at ports.'],
  ['covid-pandemic', 'online-learning', 'drives', 'strong', 'School closures pushed teaching and training online.'],
  ['aquaculture', 'antibiotic-resistance', 'influences', 'plausible', 'Antibiotics used in crowded fish farms can contribute to resistant bacteria.'],

  // Mind, behaviour and society
  ['behaviorism', 'public-schooling', 'influences', 'plausible', 'Reward-based learning ideas shaped classroom methods and testing in the 20th century.'],
  ['behaviorism', 'machine-learning', 'influences', 'speculative', 'Reinforcement learning borrows the logic of trial, reward and adjustment from animal learning research.'],
  ['psychoanalysis', 'advertising', 'influences', 'strong', 'Edward Bernays, Freud\'s nephew, used ideas about unconscious desire to shape public relations and marketing.'],
  ['psychoanalysis', 'the-novel', 'influences', 'speculative', 'Ideas about inner life and memory fed stream-of-consciousness and psychological fiction.'],
  ['cognitive-biases', 'advertising', 'influences', 'plausible', 'Marketers use anchoring, scarcity and social proof to shape choices.'],
  ['behavioral-economics', 'health-insurance', 'influences', 'plausible', 'Nudges such as default enrolment have been used to raise uptake of coverage.'],
  ['behavioral-economics', 'financial-crisis-2008', 'correlates', 'speculative', 'Herd behaviour and overconfidence are often cited as ingredients of financial bubbles.'],
  ['demographic-transition', 'japan-wages', 'influences', 'plausible', 'Japan\'s ageing, shrinking workforce is a main reason for labour shortages and rising pay.'],
  ['public-schooling', 'womens-labour-participation', 'enables', 'plausible', 'Girls\' schooling raised qualifications and expectations for paid work.'],
  ['inequality', 'us-midterms', 'influences', 'speculative', 'Economic grievances shape voter mood and which issues dominate elections.'],
  ['civil-rights-movement', 'congress-balance', 'influences', 'plausible', 'Voting rights laws reshaped the electorate, with long-run effects on party strength.'],
  ['civil-rights-movement', 'inequality', 'influences', 'plausible', 'Legal change opened some opportunities while leaving large wealth gaps in place.'],
  ['jazz', 'civil-rights-movement', 'influences', 'speculative', 'Black artistry won public respect and helped shift cultural attitudes, though its political effect is debated.'],

  // History, empire, trade and money
  ['gps', 'cartography', 'influences', 'plausible', 'Satellite positioning turned map-making into a data-driven process open to anyone with a phone.'],
  ['age-of-exploration', 'colonial-trade', 'enables', 'strong', 'New sea routes opened direct trade between Europe, the Americas, Africa and Asia.'],
  ['silk-road', 'age-of-exploration', 'influences', 'plausible', 'European demand for Asian goods pushed rulers to seek sea routes that avoided overland middlemen.'],
  ['silk-road', 'buddhism', 'enables', 'strong', 'Merchants and monks carried Buddhist teachings along the routes from India into Central and East Asia.'],
  ['colonial-trade', 'textile-mills', 'enables', 'strong', 'Raw cotton from colonial plantations fed British mills.'],
  ['colonial-trade', 'joint-stock-company', 'drives', 'strong', 'Chartered ventures like the East India companies popularised shared ownership to fund risky voyages.'],
  ['colonial-trade', 'suez-canal', 'influences', 'plausible', 'European powers wanted a shorter route to Asian markets and colonies.'],
  ['joint-stock-company', 'railways', 'enables', 'plausible', 'Share capital financed the huge upfront cost of building rail lines.'],
  ['joint-stock-company', 'industrial-rev', 'enables', 'plausible', 'Easier pooling of capital helped firms build mills and works at scale.'],
  ['gold-standard', 'inflation', 'constrains', 'plausible', 'Tying money to gold limited how fast governments could expand the money supply.'],
  ['gold-standard', 'great-depression', 'influences', 'plausible', 'Countries tied to gold had less room to cut rates, which many economists think deepened the slump.'],
  ['great-depression', 'keynesianism', 'drives', 'strong', 'The slump discredited hands-off policy and prompted Keynes\'s case for active demand management.'],
  ['keynesianism', 'bretton-woods', 'influences', 'strong', 'Keynes took a leading part in designing the post-war monetary order.'],
  ['world-war-2', 'japan-exports', 'influences', 'speculative', 'Post-war reconstruction and U.S. support set Japan on its export-led growth path.'],
  ['world-war-2', 'european-union', 'influences', 'speculative', 'Determination to prevent another continental war inspired economic integration in Western Europe.'],
  ['world-war-2', 'commercial-aviation', 'influences', 'plausible', 'Wartime advances in aircraft, airfields and trained pilots helped launch post-war airlines.'],
  ['financial-crisis-2008', 'boj-policy', 'influences', 'plausible', 'The crisis pushed major central banks, Japan\'s included, deeper into unconventional easing and bond buying.'],
  ['wto', 'globalization', 'enables', 'plausible', 'Lower barriers and predictable rules helped goods, capital and culture move more freely.'],
  ['game-theory', 'tariff-expectations', 'influences', 'speculative', 'Tariff threats and retaliation are often modelled as strategic games.'],

  // Cold War, state power and space
  ['cold-war', 'nato', 'causes', 'plausible', 'Fear of Soviet power led Western states to found a collective defence pact.'],
  ['cold-war', 'sputnik', 'drives', 'strong', 'The superpower rivalry made satellite launches a matter of prestige and security.'],
  ['cold-war', 'internet', 'influences', 'strong', 'The U.S. defence research agency funded ARPANET, the ancestor of the internet.'],
  ['cold-war', 'public-key-cryptography', 'influences', 'speculative', 'Intelligence agency work on secure communication ran in parallel with the public discovery of these methods.'],
  ['cold-war', 'oil-crisis-1973', 'influences', 'speculative', 'Superpower alignments in the Middle East shaped the politics around the oil embargo.'],
  ['nato', 'european-union', 'enables', 'plausible', 'A security guarantee gave Western Europe room to focus on economic integration.'],
  ['sputnik', 'apollo-program', 'drives', 'strong', 'Shock over Sputnik led the United States to commit to beating the Soviets to the Moon.'],
  ['apollo-program', 'semiconductors', 'influences', 'plausible', 'Guidance computers for Apollo were a significant early customer for integrated circuits.'],
  ['apollo-program', 'television', 'influences', 'speculative', 'Live broadcasts of the landing drew one of the largest early television audiences.'],
  ['apollo-program', 'reusable-rockets', 'influences', 'speculative', 'Engineering lessons from Apollo propulsion fed later launch vehicles, though modern reuse is a newer approach.'],
  ['reusable-rockets', 'communications-satellites', 'enables', 'plausible', 'Lower launch prices make large constellations of satellites affordable.'],
  ['solar-max', 'communications-satellites', 'influences', 'speculative', 'Eruptions raise radiation and drag that can disrupt or shorten the life of satellites.'],
  ['strait-of-hormuz', 'oil-prices', 'influences', 'strong', 'A large share of seaborne oil passes the strait, so tension there moves prices.'],
  ['strait-of-hormuz', 'japan-import-costs', 'influences', 'plausible', 'Japan imports much of its crude from the Gulf, so disruptions raise its energy bill.'],
  ['science-fiction', 'internet', 'influences', 'speculative', 'Novels about cyberspace helped supply the vocabulary and imagery for the online world.'],
  ['the-novel', 'science-fiction', 'influences', 'plausible', 'Science fiction grew out of the novel, extending it to imagined science and futures.'],

  // Physics, engines and electricity
  ['calculus', 'electromagnetism', 'enables', 'plausible', 'Maxwell expressed electromagnetism as differential equations, the language of calculus.'],
  ['calculus', 'neural-networks', 'enables', 'strong', 'Training networks relies on derivatives and backpropagation, which are applications of calculus.'],
  ['thermodynamics', 'refrigeration', 'enables', 'strong', 'Understanding compression, expansion and heat transfer made practical cooling machines possible.'],
  ['thermodynamics', 'greenhouse-effect', 'influences', 'plausible', 'Work on heat and radiation helped scientists explain how gases trap warmth in the atmosphere.'],
  ['thermodynamics', 'haber-bosch', 'enables', 'plausible', 'Chemistry guided by thermodynamics showed how to combine nitrogen and hydrogen at high pressure.'],
  ['steam-engine', 'electrification', 'enables', 'plausible', 'Steam turbines in power stations produced much of the early supply of electricity.'],
  ['relativity', 'gps', 'enables', 'strong', 'Satellite clocks must be corrected for relativistic effects or positions would soon drift badly.'],
  ['nuclear-fission', 'cold-war', 'drives', 'plausible', 'Nuclear weapons made superpower confrontation a matter of deterrence and arms control.'],
  ['nuclear-fission', 'nuclear-power', 'enables', 'strong', 'The same chain reaction used in bombs could be controlled to boil water in reactors.'],
  ['ring-of-fire', 'nuclear-power', 'constrains', 'speculative', 'Seismic risk shapes where reactors can be built and how readily the public accepts them in Japan.'],
  ['geomagnetic-storms', 'electrification', 'constrains', 'speculative', 'Strong storms induce currents that can damage transformers and strain power grids.'],
  ['electrification', 'radio', 'enables', 'plausible', 'Reliable power made transmitters and household receivers feasible.'],
  ['electrification', 'fordism', 'enables', 'plausible', 'Electric motors let factories arrange machines along a line rather than around a steam shaft.'],
  ['electrification', 'co2', 'causes', 'plausible', 'Fossil-fired power stations made electricity a major source of emissions.'],
  ['electrification', 'sound-recording', 'enables', 'plausible', 'Microphones and electrical recording improved sound quality from the 1920s.'],
  ['electrification', 'railways', 'influences', 'plausible', 'Electric traction made trains faster, cleaner and more frequent on busy lines.'],

  // Computing, AI, media and the internet
  ['semiconductors', 'internet', 'enables', 'strong', 'Cheap chips power the routers, servers and devices the internet depends on.'],
  ['semiconductors', 'smartphone', 'enables', 'strong', 'Dense, low-power chips made pocket computers possible.'],
  ['semiconductors', 'solar-pv', 'enables', 'strong', 'Solar cells are made from semiconductor materials such as silicon.'],
  ['public-key-cryptography', 'bitcoin', 'enables', 'strong', 'Digital signatures prove ownership of coins without a central register.'],
  ['bitcoin', 'datacentre-power', 'influences', 'speculative', 'Mining at scale consumes substantial electricity in warehouses of specialised computers.'],
  ['bitcoin', 'sanctions', 'influences', 'speculative', 'Some argue crypto can be used to move money around sanctions, though tracing has also improved.'],
  ['neural-networks', 'large-language-models', 'enables', 'strong', 'Modern language models are very large neural networks trained on text.'],
  ['machine-learning', 'recommender-systems', 'enables', 'strong', 'Models trained on behaviour data predict what each user will want next.'],
  ['machine-learning', 'sports-analytics', 'enables', 'plausible', 'Modern models mine tracking data to forecast injuries, tactics and performance.'],
  ['internet', 'machine-learning', 'enables', 'plausible', 'Web-scale text and images provided the data for training modern models.'],
  ['internet', 'streaming-music', 'enables', 'strong', 'Fast broadband made it practical to stream tracks rather than own copies.'],
  ['internet', 'globalization', 'drives', 'plausible', 'Instant communication ties together markets, workers and cultures.'],
  ['search-engines', 'machine-learning', 'drives', 'plausible', 'Ranking pages and understanding queries pushed firms to invest heavily in machine learning.'],
  ['social-media', 'youth-culture', 'influences', 'plausible', 'Platforms are where many young people now meet, share trends and invent slang.'],
  ['smartphone', 'streaming-music', 'enables', 'plausible', 'Phones with fast data plans put huge catalogues in a pocket.'],
  ['li-ion-batteries', 'smartphone', 'enables', 'strong', 'Compact rechargeable cells made slim, long-lasting phones feasible.'],
  ['recommender-systems', 'streaming-music', 'influences', 'strong', 'Personalised playlists and suggestions steer much of what people listen to.'],
  ['large-language-models', 'online-learning', 'influences', 'plausible', 'Chatbot tutors and explainers are being tried as study aids.'],
  ['large-language-models', 'peer-review', 'influences', 'speculative', 'Generated text may strain reviewers and change how papers are written and checked.'],
  ['japan-wages', 'automation-robotics', 'drives', 'plausible', 'Labour shortages push Japanese firms to adopt robots and self-service systems.'],
  ['television', 'football', 'influences', 'plausible', 'Live global broadcasts grew the audience and income of top football competitions.'],
  ['photography', 'impressionism', 'influences', 'plausible', 'Cameras took over exact likeness, nudging painters toward capturing impressions of light and movement.'],
  ['photography', 'advertising', 'influences', 'plausible', 'Reproducible images let advertisers show products realistically and at scale.'],

  // Music, art, culture and Japan
  ['sound-recording', 'rock-and-roll', 'enables', 'plausible', 'Cheap singles and studio techniques shaped the three-minute rock record.'],
  ['jazz', 'soft-power', 'influences', 'speculative', 'U.S. government-sponsored jazz tours were used to win goodwill abroad during the Cold War.'],
  ['rock-and-roll', 'youth-culture', 'drives', 'plausible', 'Rock gave teenagers their own music, fashion and identity.'],
  ['globalization', 'sushi-boom', 'enables', 'plausible', 'Global trade and travel carried Japanese food into foreign cities.'],
  ['anime-manga', 'japan-tourism', 'influences', 'speculative', 'Fans travel to see locations and shops linked to their favourite series.'],
  ['ukiyo-e', 'anime-manga', 'influences', 'speculative', 'Bold outline, flat colour and sequential storytelling in prints are seen as ancestors of manga style.'],
  ['ukiyo-e', 'haiku', 'correlates', 'plausible', 'Both flourished in Edo-period townsperson culture, often sharing themes of seasons and passing moments.'],
  ['meiji', 'impressionism', 'influences', 'speculative', 'Japan\'s opening let large numbers of prints and crafts reach Europe, feeding the vogue for Japanese design.'],
  ['meiji', 'baseball', 'influences', 'strong', 'American teachers introduced baseball during the Meiji modernisation, and it took root in schools.'],
  ['buddhism', 'zen-buddhism', 'influences', 'strong', 'Zen developed in China and Japan as a meditation-focused school within the wider Buddhist tradition.'],
  ['zen-buddhism', 'haiku', 'influences', 'plausible', 'Zen ideas of simplicity and the present moment shaped the haiku poets\' spare imagery.'],
  ['zen-buddhism', 'washoku', 'influences', 'speculative', 'Temple vegetarian cooking and the tea ceremony left marks on Japanese cuisine and its presentation.'],
  ['olympics', 'shinkansen', 'drives', 'strong', 'The 1964 Tokyo Games spurred the opening of the first bullet train line.'],
  ['football', 'soft-power', 'influences', 'plausible', 'National teams and big clubs project a country\'s identity abroad.'],
  ['baseball', 'sports-analytics', 'influences', 'strong', 'Baseball\'s wealth of discrete events invited statistical study, popularised as sabermetrics.'],
  ['statistics', 'public-sanitation', 'influences', 'plausible', 'Mapping cholera cases helped show water was the source and pushed reform.'],

  // Transport, manufacturing and trade logistics
  ['industrial-rev', 'the-novel', 'influences', 'plausible', 'Urban life and social change under industrialism became central subjects for 19th century novelists.'],
  ['industrial-rev', 'fordism', 'enables', 'plausible', 'Machine tools, interchangeable parts and factory organisation set the stage for moving assembly lines.'],
  ['textile-mills', 'industrial-rev', 'drives', 'strong', 'Powered spinning and weaving was the first sector to industrialise and pulled others after it.'],
  ['ring-of-fire', 'shinkansen', 'influences', 'speculative', 'Earthquake risk led to early warning systems that halt the trains when shaking begins.'],
  ['toyota-production-system', 'japan-exports', 'drives', 'strong', 'Efficient, high-quality production helped Japanese carmakers compete in overseas markets.'],
  ['toyota-production-system', 'global-supply-chains', 'influences', 'plausible', 'Just-in-time methods spread worldwide and tied factories to tight, far-flung supplier networks.'],
  ['automobile', 'co2', 'causes', 'strong', 'Petrol and diesel engines emit carbon dioxide in large amounts.'],
  ['automobile', 'oil-prices', 'drives', 'plausible', 'Rising car ownership has been a major source of demand for oil.'],
  ['li-ion-batteries', 'oil-prices', 'constrains', 'speculative', 'As electric cars spread, battery-powered travel could cap long-term oil demand.'],
  ['commercial-aviation', 'globalization', 'drives', 'plausible', 'Easy air travel increased contact between cultures, firms and migrants.'],
  ['container-shipping', 'japan-exports', 'enables', 'strong', 'Efficient box shipping opened distant markets to Japanese factories.'],
  ['container-shipping', 'port-congestion', 'influences', 'plausible', 'Concentrated flows through a few giant ports make hold-ups at terminals more disruptive.'],
  ['natural-harbours', 'global-supply-chains', 'influences', 'plausible', 'Deep, sheltered harbours became the hub ports that big container ships can use.'],
  ['sea-level-rise', 'natural-harbours', 'constrains', 'plausible', 'Rising seas threaten the quays, terminals and low-lying land around coastal ports.'],
  ['cold-chain', 'sushi-boom', 'enables', 'strong', 'Freezing and air freight of fish let raw seafood be served far from the coast.'],
  ['refrigeration', 'cold-chain', 'enables', 'strong', 'Cooling machines are the base technology of every link in the chain.'],
  ['supermarkets', 'plastic-pollution', 'influences', 'plausible', 'Pre-packaged goods in shops are a large source of single-use plastic waste.'],
  ['supermarkets', 'bread-prices', 'influences', 'plausible', 'Retail competition and bulk buying shape the shelf price of staples such as bread.'],
  ['plastic-pollution', 'bluefin', 'influences', 'speculative', 'Microplastics build up in ocean food webs, with effects on top predators still being studied.'],

  // Energy, farming and climate
  ['haber-bosch', 'fertilizer', 'drives', 'strong', 'Synthetic ammonia made cheap nitrogen fertilizer available at industrial scale.'],
  ['green-revolution', 'rice-prices', 'influences', 'plausible', 'Higher-yield rice varieties helped keep staple prices low across much of Asia.'],
  ['green-revolution', 'deforestation', 'influences', 'speculative', 'Higher yields per hectare may have spared some land from clearing, though the effect is debated.'],
  ['green-revolution', 'inequality', 'influences', 'speculative', 'Gains often reached larger farms first, widening rural gaps in some regions.'],
  ['crop-domestication', 'rice-prices', 'influences', 'speculative', 'Thousands of years of selection produced the staple grain whose price still shapes diets and budgets.'],
  ['mechanized-farming', 'deforestation', 'influences', 'plausible', 'Machines make it cheaper to clear and farm large new areas.'],
  ['greenhouse-effect', 'global-warming', 'causes', 'strong', 'A stronger heat-trapping blanket raises average surface temperatures.'],
  ['global-warming', 'el-nino', 'correlates', 'speculative', 'How warming will change El Niño is an open research question.'],
  ['global-warming', 'rice-prices', 'influences', 'plausible', 'Heat stress and floods threaten yields in major rice-growing regions.'],
  ['global-warming', 'japan-tourism', 'influences', 'speculative', 'Hotter summers and shifting cherry-blossom timing may change when visitors want to come.'],
  ['paris-agreement', 'energy-policy', 'influences', 'plausible', 'Pledges feed into national rules on fuels and emissions.'],
  ['solar-pv', 'energy-transition', 'drives', 'strong', 'Falling solar costs are among the main reasons renewables are expanding.'],
  ['energy-transition', 'co2', 'constrains', 'plausible', 'Replacing fossil generation lowers carbon dioxide emissions.'],
  ['oil-crisis-1973', 'japan-exports', 'influences', 'plausible', 'High fuel prices raised demand for compact, efficient Japanese cars.'],

  // Additional links
  ['co2', 'global-warming', 'causes', 'strong', 'More carbon dioxide strengthens the greenhouse effect, warming the planet.'],
  ['global-warming', 'paris-agreement', 'drives', 'strong', 'Rising temperatures and scientific warnings led governments to agree shared goals.'],
  ['global-warming', 'sea-level-rise', 'causes', 'strong', 'Meltwater and warming oceans expand and raise sea levels.'],
  ['global-warming', 'extreme-weather', 'influences', 'strong', 'A warmer atmosphere holds more moisture and energy, raising the odds of heatwaves and heavy rain.'],
  ['haber-bosch', 'green-revolution', 'enables', 'strong', 'High-yield crops needed far more nitrogen than farms could supply from manure.'],
  ['green-revolution', 'fertilizer', 'drives', 'strong', 'New varieties responded to heavy fertilizer use, boosting demand for it.'],
  ['green-revolution', 'wheat-yields', 'drives', 'strong', 'Semi-dwarf wheat was a signature success, with large gains in Mexico, India and Pakistan.'],
  ['cold-war', 'green-revolution', 'influences', 'speculative', 'Western donors backed high-yield farming partly to ease hunger and the appeal of radical politics.'],
  ['green-revolution', 'urbanization', 'influences', 'speculative', 'Higher farm productivity freed labour that then moved to the cities.'],
  ['enlightenment', 'public-schooling', 'influences', 'plausible', 'Faith in reason and progress supported arguments for educating all citizens.'],
  ['enlightenment', 'civil-rights-movement', 'influences', 'speculative', 'Appeals to universal rights from the Enlightenment tradition gave later movements a shared language.'],
  ['enlightenment', 'secularization', 'influences', 'speculative', 'Critical reasoning about authority encouraged some societies to separate religion from public life.'],
  ['greek-philosophy', 'enlightenment', 'influences', 'plausible', 'Enlightenment thinkers openly drew on classical ideas of reason and citizenship.'],
  ['world-war-2', 'bretton-woods', 'causes', 'strong', 'Allied planners designed the system during the war to avoid a repeat of 1930s monetary chaos.'],
  ['world-war-2', 'cold-war', 'causes', 'strong', 'The wartime alliance split into rival blocs as the fighting ended.'],
  ['world-war-2', 'united-nations', 'causes', 'strong', 'The Allies founded the organisation to help prevent another global war.'],
  ['world-war-2', 'penicillin', 'drives', 'strong', 'Military need pushed the mass production of penicillin for wounded soldiers.'],
  ['world-war-2', 'womens-labour-participation', 'drives', 'strong', 'With men at the front, women filled factory and office jobs in large numbers.'],
  ['great-depression', 'world-war-2', 'influences', 'speculative', 'Economic distress helped radical movements gain support in several countries.'],
  ['statistics', 'machine-learning', 'enables', 'strong', 'Learning from data rests on inference, estimation and probability.'],
  ['machine-learning', 'ai-compute', 'drives', 'strong', 'Ever larger models create fast-growing demand for chips and data centres.'],
  ['machine-learning', 'automation-robotics', 'enables', 'plausible', 'Learning-based vision and control let robots handle less structured tasks.'],
  ['neural-networks', 'machine-learning', 'enables', 'plausible', 'Deep networks drove the recent surge in what machine learning can do.'],
  ['public-key-cryptography', 'internet', 'enables', 'strong', 'Secure web traffic and payments depend on keys that strangers can exchange safely.'],
  ['internet', 'search-engines', 'enables', 'strong', 'A huge, open collection of pages made indexing and ranking worthwhile.'],
  ['internet', 'social-media', 'enables', 'strong', 'Always-on connectivity supports platforms where billions of people share posts.'],
  ['internet', 'online-learning', 'enables', 'strong', 'Video and web tools let teachers reach students anywhere.'],
  ['internet', 'newspapers', 'constrains', 'plausible', 'Free online news undermined print advertising and subscriptions.'],
  ['cold-war', 'game-theory', 'drives', 'strong', 'Nuclear standoffs funded strategic research that matured the field.'],
  ['cold-war', 'sanctions', 'influences', 'plausible', 'Embargoes and export controls were routine tools of both blocs.'],
  ['cold-war', 'olympics', 'influences', 'plausible', 'Superpower rivalry turned medal tables and boycotts into proxy contests.'],
  ['electromagnetism', 'electrification', 'enables', 'strong', 'Faraday and Maxwell\'s work on induction produced generators and motors.'],
  ['electrification', 'refrigeration', 'enables', 'strong', 'Electric compressors made home and industrial cooling practical.'],
  ['electrification', 'urbanization', 'enables', 'plausible', 'Electric light, lifts and trams let cities grow taller and denser.'],
  ['wto', 'us-japan-trade', 'influences', 'plausible', 'Agreed rules and dispute settlement frame what each side can do on tariffs.'],
  ['transistor', 'radio', 'enables', 'plausible', 'Transistors made small battery-powered receivers possible, putting radio in pockets and cars.'],

  // Additional links
  ['ocean-heat', 'sea-level-rise', 'influences', 'strong', 'Warm water expands, which accounts for a share of sea-level rise.'],
  ['red-sea', 'suez-canal', 'influences', 'strong', 'Ship diversions around conflict zones cut traffic through the canal and its fees.'],
  ['inflation', 'fiscal-rates', 'influences', 'strong', 'Higher inflation pushes expectations toward tighter policy and higher interest rates.'],
  ['financial-crisis-2008', 'fiscal-rates', 'influences', 'strong', 'Emergency spending and near-zero interest rates reshaped expectations for years afterwards.'],
  ['bretton-woods', 'usd-jpy', 'influences', 'strong', 'Japan\'s yen was held at a fixed rate to the dollar until the system broke down in the early 1970s.'],
  ['marine-heatwaves', 'aquaculture', 'influences', 'plausible', 'Warm spells can stress farmed fish and shellfish and raise disease risk.'],
  ['anchovy', 'aquaculture', 'enables', 'plausible', 'Fishmeal made from anchovy supports the feed that farmed fish depend on.'],
  ['aquaculture', 'salmon-feed', 'drives', 'strong', 'Farmed fish need large amounts of feed, which keeps fishmeal demand high.'],
  ['steam-engine', 'fossil-era', 'drives', 'strong', 'Steam engines created huge demand for coal, locking in fossil fuel use.'],
  ['inflation', 'restaurant-costs', 'influences', 'plausible', 'Rising prices for ingredients, rent and utilities feed straight into what restaurants pay.'],
  ['automation-robotics', 'restaurant-costs', 'influences', 'speculative', 'Ordering tablets and conveyor systems can cut the labour that restaurants need.'],
  ['public-sanitation', 'urbanization', 'enables', 'plausible', 'Safer water let cities grow without being repeatedly checked by epidemics.'],
  ['inflation', 'sushi-prices', 'influences', 'plausible', 'General price rises show up on menus as ingredient, rent and wage costs climb.'],
  ['extreme-weather', 'shipping-costs', 'influences', 'plausible', 'Storms, low rivers and port closures disrupt shipping schedules.'],
  ['haber-bosch', 'gas-prices', 'influences', 'plausible', 'Making ammonia consumes large volumes of natural gas, tying fertilizer to energy markets.'],
  ['mechanized-farming', 'precision-ag', 'influences', 'plausible', 'Automated machinery is the platform for GPS-guided, sensor-driven farming.'],
  ['urbanization', 'demographic-transition', 'influences', 'plausible', 'City life raises the cost of raising children and widens access to schools, lowering family size.'],
  ['aquaculture', 'seafood-feed', 'influences', 'plausible', 'Farmed supply changes what restaurants can buy and what it costs.'],
]

export interface ExtraDemoPair { id: string; from: string; to: string; title: string; blurb: string }

export const EXTRA_DEMO_PAIRS: ExtraDemoPair[] = [
  { id: 'sputnik-streaming', from: 'sputnik', to: 'streaming-music',
    title: 'Sputnik to streaming music',
    blurb: 'A Soviet beeping sphere, a race to the Moon and the chips that ended up in your pocket.' },
  { id: 'thermo-sushi', from: 'thermodynamics', to: 'sushi-prices',
    title: 'Thermodynamics to sushi prices',
    blurb: 'Why the physics of heat made it possible to serve raw tuna a world away from the sea.' },
  { id: 'crypto-rice', from: 'public-key-cryptography', to: 'rice-prices',
    title: 'Cryptography to rice prices',
    blurb: 'Prime-number mathematics, mining rigs, power demand and the cost of fertilizer.' },
  { id: 'plague-wages', from: 'black-death', to: 'japan-wages',
    title: 'The Black Death to Japan\'s labour shortage',
    blurb: 'How a medieval plague eventually led cities to clean water and, much later, a shrinking workforce.' },
  { id: 'silk-sushi', from: 'silk-road', to: 'sushi-boom',
    title: 'The Silk Road to the sushi boom',
    blurb: 'Monks carried Buddhism east, and with it a taste for simple, careful food.' },
  { id: 'jazz-yen', from: 'jazz', to: 'usd-jpy',
    title: 'Jazz to the dollar-yen rate',
    blurb: 'A route from club stages through civil rights and Congress to the currency markets.' },
  { id: 'greek-learning', from: 'greek-philosophy', to: 'online-learning',
    title: 'Greek logic to online learning',
    blurb: 'From Aristotle\'s syllogisms to chatbots that tutor students.' },
  { id: 'grain-internet', from: 'crop-domestication', to: 'internet',
    title: 'Domesticated grain to the internet',
    blurb: 'Counting harvests led to writing, and writing eventually led to the chip.' },
]
