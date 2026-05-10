// routes/v1.js — Yahoo Finance (no API key required)
import { Router } from "express";
import { fetchStockData, fetchMultipleStocks } from "../services/yahooFinance.js";

const router = Router();

const SYMBOL_RE = /^[A-Za-z0-9.\-^=]+$/;

// GET /api/v1/stock/:symbol
router.get("/stock/:symbol", async (req, res) => {
  const { symbol } = req.params;

  if (!symbol || symbol.trim() === "") {
    return res.status(400).json({ success: false, error: "Symbol parameter is required" });
  }

  if (!SYMBOL_RE.test(symbol)) {
    return res.status(400).json({ success: false, error: `Invalid symbol format: "${symbol}"` });
  }

  try {
    const data = await fetchStockData(symbol);
    return res.json({ success: true, data });
  } catch (err) {
    const isNotFound = err.message.includes("not found");
    return res.status(isNotFound ? 404 : 503).json({ success: false, error: err.message });
  }
});

// GET /api/v1/stocks?symbols=AAPL,TSLA,MSFT
router.get("/stocks", async (req, res) => {
  const { symbols } = req.query;

  if (!symbols || symbols.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Query parameter 'symbols' is required. Example: ?symbols=AAPL,TSLA,MSFT",
    });
  }

  const symbolList = symbols
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (symbolList.length === 0) {
    return res.status(400).json({ success: false, error: "Provide at least one valid symbol" });
  }

  if (symbolList.length > 20) {
    return res.status(400).json({
      success: false,
      error: `Too many symbols. Maximum is 20, you provided ${symbolList.length}`,
    });
  }

  const invalidSymbols = symbolList.filter((s) => !SYMBOL_RE.test(s));
  if (invalidSymbols.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Invalid symbol format: ${invalidSymbols.join(", ")}`,
    });
  }

  try {
    const results = await fetchMultipleStocks(symbolList);
    const successCount = results.filter((r) => r.status === "success").length;
    return res.json({
      success: true,
      meta: {
        requested: symbolList.length,
        found: successCount,
        failed: symbolList.length - successCount,
        source: "Yahoo Finance",
        timestamp: new Date().toISOString(),
      },
      results,
    });
  } catch (err) {
    return res.status(503).json({ success: false, error: err.message });
  }
});

export default router;
