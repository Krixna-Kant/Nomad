# Nomad

Your taste travels. Nomad rebuilds the small life you leave behind when you move: the cafe, the bookstore, the weeknight room, mapped onto the city you are actually landing in.

It is a taste transplant. You name real places from the old city. [Qloo](https://qloo.com) reads the culture around those places. Nomad looks for that same feeling in the new city, then fits a first week to the days you are free.

No account. You can leave an anonymous pin for the next person from your city.

## Run it locally

```bash
cd nomad
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Put your Qloo key in `.env`. Never commit that file.

| Variable | Purpose |
| --- | --- |
| `QLOO_API_KEY` | Qloo hackathon or production key |
| `QLOO_BASE_URL` | Defaults to `https://hackathon.api.qloo.com` |

## Deploy

The Next.js app lives in this `nomad` folder. API routes need a server, so this is not a static export.

On [Vercel](https://vercel.com/new):

1. Import `https://github.com/Krixna-Kant/Nomad`.
2. Set **Root Directory** to `nomad`.
3. Add `QLOO_API_KEY` and `QLOO_BASE_URL` as environment variables.
4. Deploy.

Anonymous pins are kept in memory on a serverless host, with a seed landing so the wall is not empty. A long-running Node server can also write `data/pins.json`.

The submission write-up is in [PROJECT_STORY.md](./PROJECT_STORY.md).
