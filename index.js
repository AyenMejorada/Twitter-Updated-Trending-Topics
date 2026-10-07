// Trending Topics on X (formerly Twitter)
//
// Data comes from ./trends.json, which is refreshed by a scheduled GitHub
// Actions workflow (see .github/workflows/update-trends.yml). The browser
// never talks to the trends provider directly, so there is no API key here.
//
// The chart plots trend RANK, not tweet volume. The free data provider no
// longer returns real volume numbers (it returns a flat placeholder for
// every trend), so a volume chart would be meaningless. See README.

const TREND_COUNT = 25;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

const dateElement = document.getElementById("date");
const dateOptions = { year: "numeric", month: "long", day: "numeric" };

// Set the heading date. Prefer the date the data was last updated, so an old
// snapshot does not look like today's trends. Fall back to today if we have
// no usable lastUpdated value.
function setHeadingDate(lastUpdated) {
  const updated = lastUpdated ? new Date(lastUpdated) : null;
  const dateToShow = updated && !isNaN(updated.getTime()) ? updated : new Date();
  dateElement.innerHTML = dateToShow.toLocaleDateString("en-US", dateOptions);
}

// Show today's date until trends.json loads.
setHeadingDate(null);

const statusElement = document.getElementById("status");

function showError(message) {
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = "alert alert-danger text-center";
    statusElement.hidden = false;
  }
  console.error(message);
}

function showEmptyState(message) {
  // Not an error: trends.json simply has no data yet. Use a calm info style
  // rather than the red danger style.
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = "alert alert-info text-center";
    statusElement.hidden = false;
  }
  console.info(message);
}

function showStatus(lastUpdated) {
  if (!statusElement) return;

  const updatedDate = new Date(lastUpdated);
  const readable = isNaN(updatedDate.getTime())
    ? "unknown"
    : updatedDate.toLocaleString("en-US");

  const ageMs = Date.now() - updatedDate.getTime();
  const isStale = isNaN(updatedDate.getTime()) || ageMs > STALE_AFTER_MS;

  if (isStale) {
    statusElement.textContent =
      `Last updated: ${readable}. This data may be stale (older than 24 hours).`;
    statusElement.className = "alert alert-warning text-center";
  } else {
    statusElement.textContent = `Last updated: ${readable}`;
    statusElement.className = "alert alert-secondary text-center";
  }
  statusElement.hidden = false;
}

function renderChart(topics, ranks) {
  const myChart = document.getElementById("myChart");

  // Bars are inverted rank so that rank 1 draws as the longest bar.
  const barLengths = ranks.map((rank) => TREND_COUNT - rank + 1);

  const palette = [
    "rgba(255, 99, 132, 0.2)",
    "rgba(255, 159, 64, 0.2)",
    "rgba(255, 205, 86, 0.2)",
    "rgba(75, 192, 192, 0.2)",
    "rgba(54, 162, 235, 0.2)",
    "rgba(153, 102, 255, 0.2)",
    "rgba(201, 203, 207, 0.2)",
  ];
  const borders = [
    "rgb(255, 99, 132)",
    "rgb(255, 159, 64)",
    "rgb(255, 205, 86)",
    "rgb(75, 192, 192)",
    "rgb(54, 162, 235)",
    "rgb(153, 102, 255)",
    "rgb(201, 203, 207)",
  ];

  const backgroundColor = topics.map((_, i) => palette[i % palette.length]);
  const borderColor = topics.map((_, i) => borders[i % borders.length]);

  new Chart(myChart, {
    type: "bar",
    data: {
      labels: topics,
      datasets: [
        {
          label: "Trend rank (higher bar = higher rank)",
          data: barLengths,
          borderWidth: 2,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          hoverBackgroundColor: borderColor,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            // Hide x-axis tick labels. The inverted bar length is not a
            // meaningful number to a reader; the rank lives in each bar label.
            display: false,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `Rank #${TREND_COUNT - ctx.parsed.x + 1}`,
          },
        },
      },
    },
  });
}

fetch("./trends.json", { cache: "no-store" })
  .then((res) => {
    if (!res.ok) {
      throw new Error(`Could not load trends.json (HTTP ${res.status}).`);
    }
    return res.json();
  })
  .then((data) => {
    const trends = Array.isArray(data && data.trends) ? data.trends : [];

    // Before the first scheduled run, trends.json is an empty placeholder
    // (no lastUpdated, no trends). Show a friendly message, not a red error.
    if (trends.length === 0) {
      showEmptyState(
        "Trending topics are not available yet. Please check back soon."
      );
      return;
    }

    if (trends.length < TREND_COUNT) {
      throw new Error(
        `Not enough trend data to display (found ${trends.length}, ` +
          `need ${TREND_COUNT}). Please try again later.`
      );
    }

    const slice = trends.slice(0, TREND_COUNT);
    const ranks = slice.map((t, i) => (typeof t.rank === "number" ? t.rank : i + 1));
    // Label each bar with its rank, like "1. #SB19RocksTheFMA", because the
    // bar lengths use inverted rank and are not self-explanatory on their own.
    const topics = slice.map((t, i) => `${ranks[i]}. ${t.name}`);

    showStatus(data.lastUpdated);
    setHeadingDate(data.lastUpdated);
    renderChart(topics, ranks);
  })
  .catch((err) => {
    showError(
      `Sorry, trending topics could not be loaded right now. ${err.message}`
    );
  });
