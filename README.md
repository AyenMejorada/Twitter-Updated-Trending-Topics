# X Trending Topics (formerly Twitter)

A small static site that shows the top 25 trending topics on X for the
Philippines as a horizontal bar chart (Chart.js).

Live site: https://ayenmejorada.github.io/Twitter-Updated-Trending-Topics/

Last updated: October 1, 2026

## How it works

The browser does not call any trends API directly, so no API key ships to the
client. Instead:

1. A scheduled GitHub Actions workflow (`.github/workflows/update-trends.yml`)
   runs every 6 hours and on manual trigger.
2. It runs `scripts/update-trends.js`, which calls a RapidAPI trends provider
   using the `RAPIDAPI_KEY` secret and writes the top 25 trends (name and rank
   only) to `trends.json`, along with a `lastUpdated` timestamp.
3. The page (`index.js`) fetches `./trends.json` and renders the chart.

`trends.json` ships as an empty placeholder (`lastUpdated: null`, no trends).
Until the workflow runs for the first time, the page shows a message asking you
to run the "Update trends" Action rather than any fake topics.

If the API call fails, the workflow keeps the previous `trends.json` and
commits nothing. The site never shows fabricated data. If the data is older
than 24 hours, the page shows a "data may be stale" notice.

## Why the chart uses rank, not volume

The original version charted tweet volume. The free data provider no longer
returns real volume numbers; it returns the same placeholder value for every
trend, which makes a volume chart meaningless. The chart now plots each trend's
rank instead, so the number 1 trend draws the longest bar. Rank is real,
provider-reported ordering.

## Setup

This project is free to run. It uses GitHub Actions, GitHub Secrets, and GitHub
Pages, all free for public repositories, plus a RapidAPI free tier. The
workflow is capped at 4 calls per day to stay inside the free quota.

### 1. Add the RapidAPI key as a secret

1. Get a key from the trends provider on RapidAPI (free tier).
2. In the repository, go to Settings, then Secrets and variables, then Actions.
3. Click "New repository secret".
4. Name it `RAPIDAPI_KEY` and paste your key as the value.

Never commit the key to the repository.

### 2. Enable GitHub Actions

1. Go to the Actions tab in the repository.
2. If prompted, enable workflows for this repository.
3. The "Update trends" workflow runs automatically every 6 hours. To run it
   now, open it and click "Run workflow" (manual dispatch).

The workflow needs write access to commit `trends.json`. The workflow file
already requests `contents: write`. If pushes are blocked, go to Settings, then
Actions, then General, and under "Workflow permissions" select
"Read and write permissions".

### 3. Enable GitHub Pages

1. Go to Settings, then Pages.
2. Under "Build and deployment", set Source to "Deploy from a branch".
3. Choose the branch (for example `master`) and the root folder, then save.
4. Your site is published at the URL shown on that page.

## Running the fetch script locally (optional)

```
set RAPIDAPI_KEY=your_key_here   &: Windows cmd
node scripts/update-trends.js
```

On macOS or Linux use `RAPIDAPI_KEY=your_key_here node scripts/update-trends.js`.

This writes `trends.json`. If the API fails or returns fewer than 25 trends,
the script exits with an error and leaves the existing `trends.json` unchanged.

## Files

- `index.html` and `index.js`: the static front end and chart.
- `trends.json`: the latest trends data (name, rank, and `lastUpdated`). Starts
  as an empty placeholder and is overwritten by the workflow.
- `scripts/update-trends.js`: fetches and writes `trends.json`.
- `.github/workflows/update-trends.yml`: the scheduled refresh workflow.
