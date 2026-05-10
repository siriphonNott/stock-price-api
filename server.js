// server.js
import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
import stockRoutes from "./routes/stock.js";
import v1Routes from "./routes/v1.js";
import v2Routes from "./routes/v2.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────
app.use(express.json());

// CORS (allow all origins for development)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ── Routes ──────────────────────────────────
app.use("/api", stockRoutes);
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Stock Price API",
    source: "Finnhub",
    uptime: process.uptime().toFixed(1) + "s",
    timestamp: new Date().toISOString(),
  });
});

// API Doc page
app.get("/", (_req, res) => {
  res.sendFile(resolve(__dirname, "../api-docs.html"));
});

// API usage info
app.get("/info", (_req, res) => {
  res.json({
    name: "Stock Price Realtime API",
    versions: {
      "v1": {
        source: "Yahoo Finance (no API key required)",
        endpoints: {
          singleStock: { method: "GET", path: "/api/v1/stock/:symbol", example: "/api/v1/stock/AAPL" },
          multiStock:  { method: "GET", path: "/api/v1/stocks?symbols=SYM1,SYM2", example: "/api/v1/stocks?symbols=AAPL,TSLA,MSFT" },
        },
      },
      "v2": {
        source: "Finnhub (requires FINNHUB_API_KEY)",
        endpoints: {
          singleStock: { method: "GET", path: "/api/v2/stock/:symbol", example: "/api/v2/stock/AAPL" },
          multiStock:  { method: "GET", path: "/api/v2/stocks?symbols=SYM1,SYM2", example: "/api/v2/stocks?symbols=AAPL,TSLA,MSFT" },
        },
      },
    },
    health: { method: "GET", path: "/health" },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    hint: "Visit /info for available endpoints or / for the API doc page",
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ── Start ────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log(`│  📈 Stock Price API running              │`);
  console.log(`│  http://localhost:${PORT}                   │`);
  console.log("├─────────────────────────────────────────┤");
  console.log(`│  GET /api/stock/AAPL                     │`);
  console.log(`│  GET /api/stocks?symbols=AAPL,TSLA,MSFT  │`);
  console.log("└─────────────────────────────────────────┘\n");
});

export default app;
