# 📈 Stock Price Realtime API

REST API สำหรับดึงข้อมูลราคาหุ้นแบบ Real-time รองรับ 2 แหล่งข้อมูล:

| Version | Source | API Key |
|---------|--------|---------|
| `v1` | Yahoo Finance | ไม่ต้องใช้ |
| `v2` | Finnhub | ต้องใช้ `FINNHUB_API_KEY` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ESM) |
| Framework | Express.js 4 |
| HTTP Client | Native `fetch` (Node 18+) |
| Config | dotenv |
| Data Source v1 | Yahoo Finance public API |
| Data Source v2 | Finnhub REST API |

---

## Project Structure

```
api/
├── server.js               # Express app entry point, CORS, logger, route mounting
├── package.json
├── .env                    # Environment variables (FINNHUB_API_KEY)
├── routes/
│   ├── stock.js            # Legacy unversioned routes → Yahoo Finance
│   ├── v1.js               # /api/v1/* → Yahoo Finance
│   └── v2.js               # /api/v2/* → Finnhub
└── services/
    ├── yahooFinance.js     # Yahoo Finance fetch + data transform
    └── finnhub.js          # Finnhub fetch + data transform
```

---

## Setup

```bash
cd api
npm install
```

สร้างไฟล์ `.env`:

```env
FINNHUB_API_KEY=your_finnhub_api_key_here
PORT=3000
```

รันเซิร์ฟเวอร์:

```bash
npm start          # production
npm run dev        # auto-reload (node --watch)
```

Server: `http://localhost:3000`

---

## All Endpoints

### Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "service": "Stock Price API",
  "source": "Finnhub",
  "uptime": "120.3s",
  "timestamp": "2026-05-10T10:30:00.000Z"
}
```

---

## API v1 — Yahoo Finance

> ไม่ต้องใช้ API Key | อาจมีดีเลย์ 15 นาทีในบางตลาด

### Single Stock

```
GET /api/v1/stock/:symbol
```

```bash
curl http://localhost:3000/api/v1/stock/AAPL
```

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 189.30,
    "previousClose": 188.05,
    "change": 1.25,
    "changePercent": "0.66%",
    "open": 188.50,
    "high": 190.10,
    "low": 187.90,
    "volume": 52340000,
    "marketCap": 2940000000000,
    "currency": "USD",
    "exchange": "NasdaqGS",
    "marketState": "REGULAR",
    "fiftyTwoWeekHigh": 199.62,
    "fiftyTwoWeekLow": 164.08,
    "timestamp": "2026-05-10T10:30:00.000Z"
  }
}
```

### Multi Stock

```
GET /api/v1/stocks?symbols=SYM1,SYM2,...
```

```bash
curl "http://localhost:3000/api/v1/stocks?symbols=AAPL,TSLA,MSFT,GOOGL"
```

**Response:**

```json
{
  "success": true,
  "meta": {
    "requested": 4,
    "found": 4,
    "failed": 0,
    "source": "Yahoo Finance",
    "timestamp": "2026-05-10T10:30:00.000Z"
  },
  "results": [
    { "status": "success", "symbol": "AAPL", "price": 189.30, "..." : "..." },
    { "status": "error",   "symbol": "FAKE", "error": "Symbol \"FAKE\" not found on Yahoo Finance" }
  ]
}
```

---

## API v2 — Finnhub

> ต้องใช้ `FINNHUB_API_KEY` | ข้อมูล Real-time

### Single Stock

```
GET /api/v2/stock/:symbol
```

```bash
curl http://localhost:3000/api/v2/stock/AAPL
```

**Response:**

```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "price": 189.30,
    "previousClose": 188.05,
    "change": 1.25,
    "changePercent": "0.66%",
    "open": 188.50,
    "high": 190.10,
    "low": 187.90,
    "currency": "USD",
    "exchange": "NASDAQ/NMS (GLOBAL MARKET)",
    "industry": "Technology",
    "marketCap": 2940000000000,
    "logo": "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock/logo/AAPL.png",
    "weburl": "https://www.apple.com/",
    "source": "Finnhub",
    "timestamp": "2026-05-10T10:30:00.000Z"
  }
}
```

### Multi Stock

```
GET /api/v2/stocks?symbols=SYM1,SYM2,...
```

```bash
curl "http://localhost:3000/api/v2/stocks?symbols=AAPL,TSLA,MSFT,GOOGL"
```

**Response:**

```json
{
  "success": true,
  "meta": {
    "requested": 4,
    "found": 4,
    "failed": 0,
    "source": "Finnhub",
    "timestamp": "2026-05-10T10:30:00.000Z"
  },
  "results": [
    { "status": "success", "symbol": "AAPL", "price": 189.30, "..." : "..." },
    { "status": "error",   "symbol": "FAKE", "error": "Symbol \"FAKE\" not found on Finnhub" }
  ]
}
```

---

## Field Reference — Response Fields

### v1 (Yahoo Finance) Response Fields

| Field | Full Name | คำอธิบาย (ไทย) | Example Value |
|-------|-----------|----------------|---------------|
| `symbol` | Ticker Symbol | ชื่อย่อหุ้น | `"AAPL"` |
| `name` | Company Name | ชื่อบริษัท | `"Apple Inc."` |
| `price` | Current Price | ราคาหุ้นปัจจุบัน | `189.30` |
| `previousClose` | Previous Close | ราคาปิดตลาดวันก่อนหน้า | `188.05` |
| `change` | Price Change | ราคาเปลี่ยนแปลงจากวันก่อน | `1.25` |
| `changePercent` | Percent Change | % การเปลี่ยนแปลงจากวันก่อน | `"0.66%"` |
| `open` | Open Price | ราคาเปิดตลาดของวัน | `188.50` |
| `high` | Day High | ราคาสูงสุดของวัน | `190.10` |
| `low` | Day Low | ราคาต่ำสุดของวัน | `187.90` |
| `volume` | Volume | ปริมาณการซื้อขายวันนี้ | `52340000` |
| `marketCap` | Market Capitalization | มูลค่าตลาดรวมของบริษัท (USD) | `2940000000000` |
| `currency` | Currency | สกุลเงิน | `"USD"` |
| `exchange` | Exchange | ตลาดหลักทรัพย์ที่จดทะเบียน | `"NasdaqGS"` |
| `marketState` | Market State | สถานะตลาดปัจจุบัน | `"REGULAR"` / `"CLOSED"` |
| `fiftyTwoWeekHigh` | 52-Week High | ราคาสูงสุดใน 52 สัปดาห์ที่ผ่านมา | `199.62` |
| `fiftyTwoWeekLow` | 52-Week Low | ราคาต่ำสุดใน 52 สัปดาห์ที่ผ่านมา | `164.08` |
| `timestamp` | Timestamp | เวลาที่ดึงข้อมูล (ISO 8601, UTC) | `"2026-05-10T10:30:00.000Z"` |

### v2 (Finnhub) Response Fields

| Field | Full Name | คำอธิบาย (ไทย) | Example Value |
|-------|-----------|----------------|---------------|
| `symbol` | Ticker Symbol | ชื่อย่อหุ้น | `"AAPL"` |
| `name` | Company Name | ชื่อบริษัท | `"Apple Inc"` |
| `price` | Current Price | ราคาหุ้นปัจจุบัน | `189.30` |
| `previousClose` | Previous Close | ราคาปิดตลาดวันก่อนหน้า | `188.05` |
| `change` | Price Change | ราคาเปลี่ยนแปลงจากวันก่อน | `1.25` |
| `changePercent` | Percent Change | % การเปลี่ยนแปลงจากวันก่อน | `"0.66%"` |
| `open` | Open Price | ราคาเปิดตลาดของวัน | `188.50` |
| `high` | Day High | ราคาสูงสุดของวัน | `190.10` |
| `low` | Day Low | ราคาต่ำสุดของวัน | `187.90` |
| `currency` | Currency | สกุลเงิน | `"USD"` |
| `exchange` | Exchange | ตลาดหลักทรัพย์ที่จดทะเบียน | `"NASDAQ/NMS (GLOBAL MARKET)"` |
| `industry` | Industry | กลุ่มอุตสาหกรรม | `"Technology"` |
| `marketCap` | Market Capitalization | มูลค่าตลาดรวมของบริษัท (USD) | `2940000000000` |
| `logo` | Company Logo URL | URL รูปโลโก้บริษัท | `"https://..."` |
| `weburl` | Company Website | เว็บไซต์บริษัท | `"https://www.apple.com/"` |
| `source` | Data Source | แหล่งข้อมูล | `"Finnhub"` |
| `timestamp` | Timestamp | เวลาที่รายงานจาก Finnhub (ISO 8601, UTC) | `"2026-05-10T10:30:00.000Z"` |

---

## Finnhub Endpoint Used

ภายใน `services/finnhub.js` เรียกใช้ Finnhub REST API 2 endpoints ต่อ 1 symbol:

### 1. Stock Quote

```
GET https://finnhub.io/api/v1/quote?symbol={SYMBOL}&token={API_KEY}
```

**Raw Response Fields:**

| Field | Full Name | คำอธิบาย (ไทย) | Example |
|-------|-----------|----------------|---------|
| `c` | Current Price | ราคาปัจจุบัน (real-time) | `609.65` |
| `d` | Change | ราคาเปลี่ยนแปลงจากวันปิดก่อนหน้า | `-7.16` |
| `dp` | Percent Change | % การเปลี่ยนแปลงจากวันปิดก่อนหน้า | `-1.1608` |
| `h` | High | ราคาสูงสุดของวัน | `616.77` |
| `l` | Low | ราคาต่ำสุดของวัน | `606.06` |
| `o` | Open | ราคาเปิดตลาดของวัน | `615.21` |
| `pc` | Previous Close | ราคาปิดตลาดของวันก่อนหน้า | `616.81` |
| `t` | Timestamp | Unix epoch (วินาที, UTC) → แปลงด้วย `new Date(t * 1000)` | `1778270400` |

> หาก `c` และ `t` เป็น `0` หมายความว่าไม่พบ Symbol หรือตลาดปิด

### 2. Company Profile

```
GET https://finnhub.io/api/v1/stock/profile2?symbol={SYMBOL}&token={API_KEY}
```

ใช้สำหรับดึงข้อมูล `name`, `currency`, `exchange`, `industry`, `marketCapitalization`, `logo`, `weburl`

---

## Yahoo Finance Endpoint Used

ภายใน `services/yahooFinance.js` เรียกใช้:

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1m&range=1d
```

- ไม่ต้องใช้ API Key
- ข้อมูลถูกดึงจาก `json.chart.result[0].meta`
- อาจมีดีเลย์สูงสุด 15 นาทีสำหรับบางตลาด
- ข้อมูล Real-time สำหรับหุ้น US (NYSE / NASDAQ) ในช่วงตลาดเปิด

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "error message here"
}
```

### HTTP Status Codes

| Status | สาเหตุ |
|--------|--------|
| `400` | ไม่ระบุ symbol / รูปแบบ symbol ไม่ถูกต้อง / ส่งมากกว่า 20 symbols |
| `404` | ไม่พบ symbol ในแหล่งข้อมูล |
| `503` | แหล่งข้อมูล (Yahoo Finance / Finnhub) ไม่ตอบสนอง |
| `500` | Internal server error |

### ตัวอย่าง Error

```json
{ "success": false, "error": "Symbol \"FAKE\" not found on Yahoo Finance" }
{ "success": false, "error": "Symbol parameter is required" }
{ "success": false, "error": "Too many symbols. Maximum is 20, you provided 25" }
{ "success": false, "error": "Finnhub rate limit exceeded — try again shortly" }
{ "success": false, "error": "FINNHUB_API_KEY environment variable is not set" }
```

### Multi-stock Partial Errors

ใน multi-stock endpoint หาก symbol บางตัว error จะไม่ทำให้ทั้ง request ล้มเหลว แต่จะ return ผลของแต่ละตัวแยกกัน:

```json
{
  "success": true,
  "meta": { "requested": 3, "found": 2, "failed": 1 },
  "results": [
    { "status": "success", "symbol": "AAPL", "price": 189.30 },
    { "status": "success", "symbol": "TSLA", "price": 175.00 },
    { "status": "error",   "symbol": "FAKE", "error": "Symbol \"FAKE\" not found on Finnhub" }
  ]
}
```

---

## All API Versions Summary

| Path | Version | Source | API Key |
|------|---------|--------|---------|
| `GET /api/v1/stock/:symbol` | v1 | Yahoo Finance | ไม่ต้องใช้ |
| `GET /api/v1/stocks?symbols=...` | v1 | Yahoo Finance | ไม่ต้องใช้ |
| `GET /api/v2/stock/:symbol` | v2 | Finnhub | ต้องใช้ |
| `GET /api/v2/stocks?symbols=...` | v2 | Finnhub | ต้องใช้ |
| `GET /api/stock/:symbol` | legacy | Yahoo Finance | ไม่ต้องใช้ |
| `GET /api/stocks?symbols=...` | legacy | Yahoo Finance | ไม่ต้องใช้ |
| `GET /health` | — | — | — |
| `GET /` | — | API info | — |

---

## Notes

- Symbol validation: อนุญาตเฉพาะตัวอักษร `A-Z`, `0-9`, `.`, `-`, `^`, `=`
- Multi-stock: รองรับสูงสุด **20 symbols** ต่อ request
- Finnhub free tier: rate limit ~30 req/sec
- Yahoo Finance: ไม่มี official rate limit แต่ใช้ User-Agent header เพื่อหลีกเลี่ยงการถูก block
