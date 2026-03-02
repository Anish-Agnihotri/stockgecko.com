![StockGecko landing image](https://github.com/user-attachments/assets/10234bb9-c50e-4831-b6d1-905b4b6dfbe6)

<p align="center">StockGecko aggregates <b>270+ markets</b> across <b>85+ assets</b> and <b>12+ venues</b>—covering stocks, indices, commodities, FX, and pre-IPO perps.</p>

## Setup & Usage

StockGecko is a single entrypoint [Bun](https://bun.sh) runtime project:

- Front-end: [SvelteKit@5](https://svelte.dev/docs/kit/introduction), [Tailwind@4](https://tailwindcss.com/), [shadcn-svelte](https://www.shadcn-svelte.com/), and [Apache echarts](https://echarts.apache.org/en/index.html)
- Indexer: [Workflow DevKit](https://useworkflow.dev/) workflows, procced periodically via [Vercel Cron](./vercel.json)
- Storage: PostgreSQL via [Prisma](https://prisma.io) ORM, flat append-only schema

---

### Environment variables

To run the application locally or build for deployment, you must first populate a `.env` environment variable file:

```bash
# Copy sample env file and populate
cp .env.sample .env
vim .env
```

By default, only `DATABASE_URL` is required to run locally:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CRON_SECRET` | Bearer token for cron endpoint authentication (>32 characters, e.g. via `openssl rand -hex 32`). Notice: this env var is automatically injected by [Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs) jobs via `Authorization` header. |
| `VERCEL_DEPLOY_HOOK` | StockGecko is statically-rendered for maximal performance. Once connected via Git, this deploy hook is proceed periodically by [cron jobs](./vercel.json) to rebuild all static pages with fresh data. |

---

### Build from source locally

#### Prerequisites

To build from source, you will need to have installed the [Bun](https://bun.sh) runtime, populated environment variables, and have a running PostgreSQL instance.

```bash
# Install dependencies
make install

# Run initial setup target
# This will take ~3 minutes
make setup
```

> [!NOTE]
> 
> The initial setup target does a few things under the hood:
> 
> 1. Initializes the database by loading the schema via Prisma migration
> 2. Runs the dev server in background (including [`@workflow/world-local`](https://useworkflow.dev/worlds/local) job runtime)
> 3. Runs the core [collectMarkets](./src/workflows/collect.ts) workflow twice to bootstrap market data for [initial render](./src/lib/load.ts)
> 4. Kills and exists running dev server

> [!TIP]
> Install Bun via `curl -fsSL https://bun.sh/install | bash` (after validating the script).
>
> [postgres.app](postgres.app) is a convenient installation package for PostgreSQL on MacOS.

#### Running dev server

Once initial setup is complete, you can run the application per usual:

```bash
# Run dev server (http://localhost:5173)
make

# Optionally: run workflow observability UI (http://localhost:3456)
make workflow

# Optionally: proc fresh market collection
make test-collect
```

It will take at least two collections seperated by 24h to initially populate 24h change metrics.

Quicklinks: [local dev](http://localhost:5173), [workflow observability UI](http://localhost:3456).

---

### Deploy to Vercel

By default: StockGecko is optimized for deploying to Vercel:

1. We use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) via [vercel.json](./vercel.json) to proc market collection and static rebuilds
2. We use [`@workflow/world-vercel`](https://useworkflow.dev/worlds/vercel) for managed job workflow execution
3. We use the `experimental_bun1.x` runtime via `@sveltejs/adapter-vercel` for SvelteKit
4. We use regional serverless function execution to bypass geoblocking APIs ([`/api/proxy`](./src/routes/api/proxy/+server.ts) via `lhr1`)
5. We trigger periodic static regeneration via [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks) a la Git integration

To deploy, simply fork and connect Git repository or use `vercel --prod` via CLI.

> [!NOTE]
>
> Generally, deployment is overfit to Vercel for ease of future maintenance and convenience (dev note: you would not believe how much inbound I get for old projects no longer maintained). The idea is to set-it-and-forget-it and have everything broadly work (occasionally throwing failure notifications at rebuild-time, for catastrophic issues).
>
> The cost-structure of the project fits reasonably within the Pro plan ($20/m), with the most expensive parameter being the frequency of static regeneration jobs (that each take about 90s on performance build machines). By default this is set to run hourly, but is easily configurable in [vercel.json](./vercel.json).

---

### Deploy elsewhere

Should you choose to deploy elsewhere, there are a few easy modifications to make:

1. Migrate from embedded cron key in [vercel.json](./vercel.json) to your own minimal scheduled execution utility (e.g., `cron` itself, `systemd` timer)
2. Use one of the alternative [`@workflow/*`](https://useworkflow.dev/worlds) worlds for job workflow execution
3. Remember to setup periodic static regeneration (as simple as procc'ing a new build)

---

### Adding markets

New markets can be tracked via a [single JSON configuration file](./src/config/tickers.json).

For existing venues, adding the market `ref` itself should automatically populate the data with history beginning at first origin in API response payloads (not just time of first addition to config).

## Architecture

Fair warning: this project is closer to the _experimental_-edge of current web tech stacks as a function of the dev's development enjoyment and urge to play with new tech. Some fun quirks/notes below:

> [!TIP]
>
> VSCode users (and agents) may find the opinionated [`.vscode/settings.json`](https://gist.github.com/Anish-Agnihotri/698f3f94ed8f7adc83f51101d48d4ac9) handy in navigating the project.

### Durable workflows

All of the market data collection in this project (effectively, the indexing or _back-end_) is performed via [Workflow devkit](https://useworkflow.dev/) which handles execution, retries, etc. Generally, it injects the workflow steps as serverless execution routes in `./src/routes/.well-known`, which are then executed via `workflow/api@start`.

This is used to implement collection across: [Aster](./src/workflows/collection/aster.ts), [Binance](./src/workflows/collection/binance.ts), [edgeX](./src/workflows/collection/edgex.ts), [Extended](./src/workflows/collection/extended.ts), [Hyperliquid](./src/workflows/collection/hyperliquid.ts) (including: Trade[XYZ], Felix, DreamCash, Ventuals, Kinetiq Markets), [Lighter](./src/workflows/collection/lighter.ts), [Ostium](./src/workflows/collection/ostium.ts), [QFEX](./src/workflows/collection/qfex.ts), and [Vest](./src/workflows/collection/vest.ts).

This data is used to statically regenerate the site at an hourly cadence, with a transformed [`DiffedSnapshot`](./src/lib/load.ts) injected into the root SvelteKit layout (note: [_slightly_ better performance when benchmarked](https://github.com/Anish-Agnihotri/stockgecko.com/tree/aa/bench-min-layout-load) than splitting the payload across routes, in an attempt to reduce `__data.json` size, and more consistent than an [ISR via Vercel Edge Config](https://github.com/Anish-Agnihotri/stockgecko.com/commit/839e56b8e263d7dbbc3f4675d089a322b09d38da) approach, given statistical pages).

### Geoblock proxy

Binance Futures API geo-blocks even `GET` requests (dev note: I know).

There's a generic, but authenticated (to prevent malicious local cache access), proxy endpoint at `/api/proxy` ([impl](https://github.com/Anish-Agnihotri/stockgecko.com/commit/db3a60193f99608ecc053fa1e6a143f4655898a7)) that proxies through `lhr1`, London.

### Comodo AAA CA

Ostium's metadata backend is deployed to `ostium.io` (rather than their API origin at `ostium.com`). This service uses the _Comodo AAA_ root certificate authority, which is now deprecated in cutting-edge Node/Bun ([release](https://nodejs.org/en/blog/release/v24.7.0)) (dev note: I know).

We load the [certificate](./src/lib/certs/comodo-aaa.pem) explicitly to override allowed CA's via `Bun.fetch` in `/api/proxy`.

### Font subsetting

To minimize font size and RTT, we have extracted weights `300`-`500` from Inter Variable via [`source-foundry/Slice`](http://github.com/source-foundry/Slice), then hard subset via [`TupiC/glypher`](https://github.com/TupiC/glypher), and return as an immutable, single cached file from same origin as site ([commit](https://github.com/Anish-Agnihotri/stockgecko.com/commit/2d26d5263150e4c1d3e88322aedd2bd4befc565a)).

### GDR normalization

Surprisingly, most markets across venues are either entirely de-duplicated (easy, track as new market) or use a consistent data source (easy, normalize to same asset).

But, Korean equity markets across Trade[XYZ] and Lighter are the first (and probably not last) exception where Trade[XYZ] uses the USD-denominated Global Depository Receipt (GDR) markets and Lighter uses the KRW-denominated KRX markets.

In these cases, we choose not to medianize ([commit](https://github.com/Anish-Agnihotri/stockgecko.com/commit/5c43278f65408d894faf6cd8087106b96fcb9ba2)) and visually prefer the source currency, but still surface both markets, with their individual currency denominations, as a single asset entity.

---

Many other quirks exist across the codebase. Feel free to reference `@dev:` notes-to-self or [commit log](https://github.com/Anish-Agnihotri/stockgecko.com/commits/main/).

## License

[GNU Affero GPL v3.0](./LICENSE)