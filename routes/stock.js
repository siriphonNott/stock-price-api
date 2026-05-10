// routes/stock.js
import { Router } from "express";
import { fetchStockData, fetchMultipleStocks } from "../services/yahooFinance.js";

const router = Router();

// ─────────────────────────────────────────────
// GET /api/stock/:symbol
// Single stock price lookup
// Example: GET /api/stock/AAPL
// ─────────────────────────────────────────────
router.get("/stock/:symbol", async (req, res) => {
  const { symbol } = req.params;

  if (!symbol || symbol.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Symbol parameter is required",
    });
  }

  // Basic symbol validation (letters, dots, hyphens only)
  if (!/^[A-Za-z0-9.\-^=]+$/.test(symbol)) {
    return res.status(400).json({
      success: false,
      error: `Invalid symbol format: "${symbol}"`,
    });
  }

  try {
    const data = await fetchStockData(symbol);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const isNotFound = err.message.includes("not found");
    return res.status(isNotFound ? 404 : 503).json({
      success: false,
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/stocks?symbols=AAPL,TSLA,MSFT
// Multi stock price lookup (comma-separated)
// Max 20 symbols per request
// ─────────────────────────────────────────────
router.get("/stocks", async (req, res) => {
  const { symbols } = req.query;

  if (!symbols || symbols.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Query parameter 'symbols' is required. Example: ?symbols=AAPL,TSLA,MSFT",
    });
  }

  // Parse and clean symbols list
  const symbolList = symbols
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (symbolList.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Please provide at least one valid symbol",
    });
  }

  if (symbolList.length > 20) {
    return res.status(400).json({
      success: false,
      error: `Too many symbols. Maximum is 20 per request, you provided ${symbolList.length}`,
    });
  }

  // Validate each symbol
  const invalidSymbols = symbolList.filter((s) => !/^[A-Za-z0-9.\-^=]+$/.test(s));
  if (invalidSymbols.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Invalid symbol format: ${invalidSymbols.join(", ")}`,
    });
  }

  try {
    const results = await fetchMultipleStocks(symbolList);

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return res.json({
      success: true,
      meta: {
        requested: symbolList.length,
        found: successCount,
        failed: errorCount,
        timestamp: new Date().toISOString(),
      },
      results,
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
