# Arbitrage Platform 🚀

Real-time crypto arbitrage detection platform with WebSocket streaming from multiple exchanges.

## 📊 Features

- **Real-time Price Streaming** via WebSocket
- **Cross-Exchange Arbitrage Detection** (gaps > 0.5%)
- **Triangular Arbitrage** (coming soon)
- **Redis Pub/Sub** for scalability
- **PostgreSQL** for historical data
- **React Dashboard** with live charts

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              ARBITRAGE PLATFORM                      │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │Binance  │  │ Bybit   │  │Coinbase │  │ Kraken  ││
│  │  WS     │  │  WS     │  │  WS     │  │  WS     ││
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘│
│       │            │            │            │      │
│       └────────────┴────────────┴────────────┘      │
│                        │                           │
│                        ▼                           │
│              ┌─────────────────┐                 │
│              │  ARBITRAGE       │                 │
│              │  DETECTOR        │                 │
│              │  (Node.js)       │                 │
│              └────────┬────────┘                 │
│                       │                           │
│         ┌────────────┼────────────┐              │
│         ▼            ▼            ▼              │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│    │  Redis  │  │Frontend │  │Postgres │        │
│    │  Pub/Sub│  │ (React) │  │  DB     │        │
│    └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional, for Pub/Sub)
- PostgreSQL (optional, for history)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📡 WebSocket Endpoints

| Exchange | Endpoint | Auth Required |
|----------|----------|--------------|
| Binance | `wss://stream.binance.com:9443/ws` | ❌ No |
| Bybit | `wss://stream.bybit.com/v5/ws` | ❌ No |
| Coinbase | `wss://ws-feed.exchange.coinbase.com` | ❌ No |
| Kraken | `wss://ws.kraken.com` | ❌ No |

## 🔧 Environment Variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=8080
NODE_ENV=development

# Arbitrage Settings
MIN_ARBITRAGE_PERCENT=0.5
MIN_VOLUME_USD=1000
```

## 📁 Project Structure

```
arbitrage-platform/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── services/
│   │   │   ├── websocket/
│   │   │   │   ├── binance.ts    # Binance WS
│   │   │   │   ├── bybit.ts      # Bybit WS
│   │   │   │   ├── coinbase.ts   # Coinbase WS
│   │   │   │   └── kraken.ts     # Kraken WS
│   │   │   ├── redis/
│   │   │   │   └── publisher.ts  # Redis Pub/Sub
│   │   │   └── arbitrage/
│   │   │       └── detector.ts   # Arbitrage engine
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PriceTicker.tsx
│   │   │   └── ArbitrageAlert.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   └── store/
│   │       └── useStore.ts
│   └── package.json
└── README.md
```

## 🎯 Supported Exchanges

1. **Binance** - Highest liquidity
2. **Bybit** - Low latency, good for perpetuals
3. **Coinbase** - Regulated, US/EU markets
4. **Kraken** - Reliable, good altcoin selection

## 📈 Arbitrage Detection

### Cross-Exchange
```
Buy BTC on Exchange A at $67,000
Sell BTC on Exchange B at $67,500
Profit: $500 (0.75%)
```

### Detection Threshold
- Minimum arbitrage: 0.5%
- Minimum volume: $1,000 USD

## 🔒 Safety Rules

1. **NEVER execute trades without manual approval**
2. **ALWAYS use sandbox/testnet first**
3. **Account for fees** (typically 0.1-0.2%)
4. **Consider withdrawal times** between exchanges
5. **Verify prices before execution**

## 📜 License

MIT License - Personal use only

## 🤝 Authors

- Jarvis AI Assistant
- James (@jamescmoura)

---

**⚠️ IMPORTANT**: This platform is for educational and research purposes. Always conduct thorough testing before executing real trades.
