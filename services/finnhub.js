// services/finnhub.js
// Fetches real-time stock data from Finnhub REST API

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function getToken() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB_API_KEY environment variable is not set");
  return token;
}

async function get(path) {
  const url = `${FINNHUB_BASE}${path}&token=${getToken()}`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`Network error reaching Finnhub: ${err.message}`);
  }
  if (res.status === 429) throw new Error("Finnhub rate limit exceeded — try again shortly");
  if (!res.ok) throw new Error(`Finnhub returned HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch quote + company profile for a single symbol.
 * @param {string} symbol - Stock ticker (e.g. "AAPL")
 */
export async function fetchStockData(symbol) {
  const sym = symbol.toUpperCase();

  const [quote, profile] = await Promise.all([
    get(`/quote?symbol=${encodeURIComponent(sym)}`),
    get(`/stock/profile2?symbol=${encodeURIComponent(sym)}`),
  ]);

  // Finnhub returns all-zero quote for unknown symbols
  if (!quote.c && !quote.t) {
    throw new Error(`Symbol "${sym}" not found on Finnhub`);
  }

  const price = quote.c;
  const prevClose = quote.pc;
  const change = parseFloat((price - prevClose).toFixed(4));
  const changePercent = prevClose ? `${((change / prevClose) * 100).toFixed(2)}%` : null;

  return {
    symbol: sym,
    name: profile.name ?? null,
    price,
    previousClose: prevClose,
    change,
    changePercent,
    open: quote.o ?? null,
    high: quote.h ?? null,
    low: quote.l ?? null,
    currency: profile.currency ?? null,
    exchange: profile.exchange ?? null,
    industry: profile.finnhubIndustry ?? null,
    marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1_000_000 : null,
    logo: profile.logo ?? null,
    weburl: profile.weburl ?? null,
    source: "Finnhub",
    timestamp: quote.t ? new Date(quote.t * 1000).toISOString() : new Date().toISOString(),
  };
}

/**
 * Fetch stock data for multiple symbols in parallel.
 * @param {string[]} symbols - Array of ticker symbols
 */
export async function fetchMultipleStocks(symbols) {
  const results = await Promise.allSettled(symbols.map((s) => fetchStockData(s)));

  return results.map((result, i) => {
    if (result.status === "fulfilled") {
      return { status: "success", ...result.value };
    }
    return {
      status: "error",
      symbol: symbols[i].toUpperCase(),
      error: result.reason?.message ?? "Unknown error",
    };
  });
}
