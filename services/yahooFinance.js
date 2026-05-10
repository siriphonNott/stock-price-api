// src/services/yahooFinance.js
// Fetches stock data from Yahoo Finance public API (no key required)

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

/**
 * Fetch stock data for a single symbol from Yahoo Finance
 * @param {string} symbol - Stock ticker (e.g. "AAPL")
 * @returns {object} Parsed stock data
 */
export async function fetchStockData(symbol) {
  const url = `${YAHOO_BASE_URL}/${encodeURIComponent(symbol.toUpperCase())}?interval=1m&range=1d`;

  let res;
  try {
    res = await fetch(url, { headers: HEADERS });
  } catch (err) {
    throw new Error(`Network error reaching Yahoo Finance: ${err.message}`);
  }

  if (!res.ok) {
    throw new Error(`Yahoo Finance returned HTTP ${res.status} for symbol "${symbol}"`);
  }

  const json = await res.json();

  // Check for Yahoo-level errors
  const chartResult = json?.chart?.result;
  const chartError = json?.chart?.error;

  if (chartError) {
    throw new Error(`Yahoo Finance error: ${chartError.description || chartError.code}`);
  }

  if (!chartResult || chartResult.length === 0) {
    throw new Error(`Symbol "${symbol.toUpperCase()}" not found on Yahoo Finance`);
  }

  const meta = chartResult[0].meta;

  if (!meta) {
    throw new Error(`No data available for symbol "${symbol.toUpperCase()}"`);
  }

  // Calculate price change
  const price = meta.regularMarketPrice ?? null;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const change = price !== null && prevClose !== null ? parseFloat((price - prevClose).toFixed(4)) : null;
  const changePercent =
    change !== null && prevClose
      ? `${((change / prevClose) * 100).toFixed(2)}%`
      : null;

  return {
    symbol: meta.symbol ?? symbol.toUpperCase(),
    name: meta.shortName ?? meta.longName ?? null,
    price,
    previousClose: prevClose,
    change,
    changePercent,
    open: meta.regularMarketDayHigh ? (meta.regularMarketOpen ?? null) : null,
    high: meta.regularMarketDayHigh ?? null,
    low: meta.regularMarketDayLow ?? null,
    volume: meta.regularMarketVolume ?? null,
    marketCap: meta.marketCap ?? null,
    currency: meta.currency ?? null,
    exchange: meta.exchangeName ?? meta.fullExchangeName ?? null,
    marketState: meta.marketState ?? null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetch stock data for multiple symbols in parallel
 * @param {string[]} symbols - Array of ticker symbols
 * @returns {object[]} Array of results (success or error per symbol)
 */
export async function fetchMultipleStocks(symbols) {
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchStockData(symbol))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        status: "success",
        ...result.value,
      };
    } else {
      return {
        status: "error",
        symbol: symbols[index].toUpperCase(),
        error: result.reason?.message ?? "Unknown error",
      };
    }
  });
}
