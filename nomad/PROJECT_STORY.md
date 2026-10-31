# Project story

## Inspiration

A move keeps the job, the lease, and the flight. It does not keep the Tuesday table, the bookstore that stays open late, or the room where the band is close enough to talk to. I kept meeting the same gap. Relocation tools find apartments and transit. Discovery apps rank what is popular nearby. Neither one knows the person who just arrived.

Someone who loved an independent bookstore and a small music room does not want the highest-rated commercial street in the new city. They want the cultural twin of what already felt like home. That missing piece is taste, not another "cafes near me" list.

Nomad, a taste transplant, starts from the places that made the old city feel like yours. Qloo's taste graph reads the culture around those real places. The new city is searched for that feeling, then the matches are turned into a first week you can actually keep.

## What I learned

The important input is not "what categories do you like?" It is "which places made the last city feel like home, and what did you love about them?" Two people can love the same cafe for opposite reasons. One wants a quiet table for work. The other wants the crowd. The sentence captures that. Qloo still has to receive a resolved entity, with an id, or the taste graph has nothing solid to read.

I also learned that a list is not a life. Ten good places with no regard for free evenings is homework. Availability, and whether someone came to meet people or to be left alone, changes which day a place lands on.

Popularity is a weak guide for belonging. A venue everyone already knows is often the wrong landing. The ranker treats a very famous place as slightly less useful than a cultural match, and it drops hotels and pure tourist stops.

## How I built it

Nomad is a Next.js app. The page is one scroll: why a move hurts, how Qloo sits in the product, then a five-step onboarding that feels like telling someone about your life.

1. Where you are moving, or one sentence such as "from Delhi to Berlin for work."
2. Three to five real places, searched on Qloo, with an optional note about why you love each one. A Maps link can start the search. An unmatched name stays as a note and is not sent to Qloo.
3. What the new week should hold, separate from what you already love.
4. A weekly grid of free time, plus how far you will travel and what you will spend.
5. A Lifestyle DNA reading you can correct before any map is drawn.

On confirm, the server sends the matched entity ids to Qloo's insights API and asks for places in the destination that share that affinity. Each survivor is labeled restore, stretch, or gather. The week uses only the days marked free. If the goal is to meet people, the week leans toward gatherings. If the goal is to explore, it leaves room for something new.

Places are drawn on an OpenStreetMap of the new city. The DNA, the map, the cards, and the week reveal as you scroll. The itinerary can be downloaded as a text file. A landing can be pinned with no name and no account, so the next person from that city can see how a similar jump looked.

Ranking a candidate place \(p\) uses Qloo affinity \(a(p)\), a bonus when it behaves like a third place (cafe, bookshop, venue, park), and a small penalty when it is already extremely popular:

$$
s(p) = a(p) + 0.28 \cdot \mathbf{1}_{\text{third}}(p) - 0.08 \cdot \mathbf{1}_{\text{famous}}(p)
$$

Hotels and similar non-places score \(-1\) and are removed.

## Challenges

Qloo is honest about a place, including payments, pickup, and wheelchair access. Those tags are true and useless as taste. Early profiles looked like a facilities list. Filtering that noise, without throwing away "book store" or "live music," took several passes.

The first map was a field of blue dots, then a soft blur. It did not show a city. Replacing it with a real map meant fitting markers to latitude and longitude, and abandoning a basemap that answered every tile with an API-key warning. OpenStreetMap draws the streets. The dots are the matched places.

The other hard split was the interface. A traditional interest form (music, food, nightlife) would have been easier to store and wrong for the product. The guided steps plus a single sentence had to produce the same structured profile: cities, resolved entities, goals, and free days. The sentences stay on the profile. They are not sent off to be guessed.

Anonymous pins were the last constraint. There is no login, so there is no user row to attach a plan to. The seed landing ships in code. New pins live in memory, and on a normal server they also write to disk. A serverless host will not keep every pin forever, and the product says so by staying anonymous rather than pretending to be an account system.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Qloo, Leaflet, OpenStreetMap, Node.js
