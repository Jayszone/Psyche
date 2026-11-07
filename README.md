# Psyche

*Every event is a butterfly. Find where it lands.*

Drop in an event, pick something close to you, and Psyche draws the chain of hops between them: who holds the information at each step, how strong each link is, and how much of the signal is left by the time it arrives.

The name: in Greek, *psyche* means both "soul" and "butterfly".

## Run it

Open `index.html`. The three built-in examples work anywhere (US midterms to Mumbai's BMC, Versailles to WWII, a new AI chief to Indian grain prices).

The live **Trace it** button only works inside a Claude artifact, where the page can ask Claude to draw the chain. Elsewhere it is disabled.

## Roadmap

1. A typed graph: events, actors, markets, institutions and places as nodes, with relations like "sets policy for" as edges.
2. Grounded links: each edge cites a real source such as news, filings or datasets.
3. A shared graph that grows across queries.
4. A personal layer, so "close to you" means your city, job or portfolio.
5. Real deployment with its own backend calling the Claude API.
