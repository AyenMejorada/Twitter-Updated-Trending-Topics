// update-trends.js
// Fetches trending topics from the RapidAPI provider and writes the top 25
// (name and rank only) to trends.json at the repo root.
//
// Design rules (see README):
// - Never write fake or empty data. If the API fails or returns too few
//   trends, exit non-zero and leave the existing trends.json untouched.
// - Record a lastUpdated ISO timestamp on every successful write.
// - The daily call cap is enforced by the workflow schedule (max 4 runs/day),
//   so this script performs exactly one API call per run.
//
// Secret: RAPIDAPI_KEY is read from the environment (GitHub Secrets).
// It is never hardcoded or logged.

const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = path.join(__dirname, "..", "trends.json");
const TREND_COUNT = 25;

const RAPIDAPI_HOST = "twitter-trends5.p.rapidapi.com";
const API_URL = `https://${RAPIDAPI_HOST}/twitter/request.php`;
// 23424934 is the WOEID for the Philippines (formerly Twitter's "Where On
// Earth ID" location code). Override with the WOEID env var if needed.
const WOEID = process.env.WOEID || "23424934";

// Throwing (rather than calling process.exit here) gives the script a single
// exit path in run()'s catch. That way no code runs after a failure, so a
// failed fetch can never fall through and overwrite trends.json.
function fail(message) {
  throw new Error(message);
}

async function run() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    fail("RAPIDAPI_KEY is not set. Add it as a GitHub Actions secret.");
  }

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPIDAPI_HOST,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ woeid: WOEID }),
    });
  } catch (err) {
    fail(`network error contacting the provider: ${err.message}`);
  }

  console.log(`Provider responded with HTTP ${res.status}.`);
  if (!res.ok) {
    fail(`provider returned HTTP ${res.status}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    fail(`could not parse provider response as JSON: ${err.message}`);
  }

  const trends = Array.isArray(data && data.trends) ? data.trends : null;
  if (!trends || trends.length < TREND_COUNT) {
    fail(
      `provider returned ${trends ? trends.length : 0} trends, ` +
        `need at least ${TREND_COUNT}. Keeping previous trends.json.`
    );
  }

  // Store name and rank only. Rank is 1-based and reflects the order the
  // provider returns, which is its trending order. We deliberately drop
  // volume: the free provider returns a flat placeholder value for it, so it
  // carries no real information (see README).
  const topics = [];
  for (let i = 0; i < TREND_COUNT; i++) {
    const name = trends[i] && trends[i].name;
    if (typeof name !== "string" || name.trim() === "") {
      fail(`trend at index ${i} has no usable name. Keeping previous trends.json.`);
    }
    topics.push({ rank: i + 1, name: name });
  }

  const output = {
    lastUpdated: new Date().toISOString(),
    location: (data.location && data.location.name) || "Philippines",
    woeid: WOEID,
    trends: topics,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(
    `Wrote ${topics.length} trends to trends.json (lastUpdated ${output.lastUpdated}).`
  );
}

run().catch((err) => {
  // Single exit path for every failure. trends.json is never written on this
  // path, so the previous file is preserved. The API key is never logged.
  console.error(`update-trends failed: ${err.message}`);
  process.exit(1);
});
