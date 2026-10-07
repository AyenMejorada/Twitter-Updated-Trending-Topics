# X Trending Topics (formerly Twitter)

## What is this?

This is a small website that shows the top 25 trending topics on X (formerly
Twitter) for the Philippines, drawn as a simple bar chart. It updates on its
own twice a day, so you can glance at what people are posting about.

Live site: https://ayenmejorada.github.io/Twitter-Updated-Trending-Topics/

## How it works

Think of it like a little robot with a daily routine. Twice a day the robot
checks X's trending list, writes down the top 25 topics in a file called
`trends.json`, and saves it. The website then reads that file and draws the
chart. The robot is a GitHub Action, which is just a task GitHub runs for you
on a schedule. Your browser never talks to X directly, so no password or key
is ever sent to visitors.

## Why the chart shows rank instead of tweet counts

The chart shows each topic's rank (number 1, number 2, and so on) rather than
how many posts it has. The free data source we use no longer gives real post
counts; it returns the same placeholder number for every topic. Showing a fake
count would be misleading, so we show rank instead, which is real. The number 1
trend gets the longest bar.

## Is it free?

Yes. GitHub is free for public projects like this one, including the robot
(GitHub Actions) and the website hosting (GitHub Pages). The data source has a
free Basic plan with a hard limit of 100 requests per month. This project uses
about 60 a month. If it ever reached the limit, the free plan simply stops
answering until the next month rather than charging you. Note that RapidAPI may
ask for a card to sign up, even for the free plan.

## Want to run your own copy?

You do not need to be a programmer. Follow these steps:

1. Fork this repository. "Fork" means make your own copy on your GitHub
   account. Use the Fork button near the top of the repository page.
2. Get a free data key. Sign up at RapidAPI and subscribe to the free plan of
   the "Twitter Trends" provider. They will give you a key, which is a long
   string of letters and numbers. Choose only the free Basic plan and do not
   upgrade.
3. Add the key as a secret. In your forked repository, go to Settings, then
   Secrets and variables, then Actions. Click "New repository secret". Name it
   exactly `RAPIDAPI_KEY` and paste your key as the value. A secret is a safe
   hiding place that the robot can read but visitors cannot.
4. Turn on Actions. Open the Actions tab. If GitHub asks, confirm that you want
   to enable workflows. You can run the "Update trends" task by hand with the
   "Run workflow" button, or wait for its twice-a-day schedule.
5. Turn on GitHub Pages. Go to Settings, then Pages. Under "Build and
   deployment", set the source to your branch (for example `master`) and the
   root folder, then save. GitHub will show you the web address of your copy.

Never paste your key directly into the code, and never share it with anyone.
The only place it belongs is the `RAPIDAPI_KEY` secret.

## If something looks wrong

- The page says trends are not available yet. The robot has not run for the
  first time. Open the Actions tab and run the "Update trends" task by hand.
- The page says the data may be stale. The last update is more than 24 hours
  old. Open the Actions tab and look for a failed run, shown with a red mark.
- The Action fails with "RAPIDAPI_KEY is not set". The secret is missing or its
  name is misspelled. Add it again, and make sure the name is exactly
  `RAPIDAPI_KEY`.

## Files

- `index.html`: the web page itself, including the chart area.
- `index.js`: the code that reads `trends.json` and draws the chart.
- `trends.json`: the saved list of trending topics. The robot overwrites this.
- `scripts/update-trends.js`: the robot's instructions for fetching trends.
- `.github/workflows/update-trends.yml`: the schedule that runs the robot.
