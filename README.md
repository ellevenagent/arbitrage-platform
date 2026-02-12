# Arbitrage Platform 🚀

Real-time crypto arbitrage detection platform with WebSocket streaming from multiple exchanges.

## 📊 Features

- **Real-time Price Streaming** via WebSocket
- **Cross-Exchange Arbitrage Detection** (gaps > 0.5%)
- **Triangular Arbitrage** (NEW!)
- **Redis Pub/Sub** for scalability
- **PostgreSQL** for historical data
- **React Dashboard** with live charts
- **Security Hardened** (Helmet, Rate Limiting, Input Validation)

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

## 🚀 Quick Start (All-in-One)

We recommend using `pnpm` for faster installation.

1. **Install Dependencies:**
   ```bash
   pnpm install
   pnpm run install:all
   ```

2. **Configure Environment:**
   
   **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   # Create .env with:
   # VITE_WS_URL=http://localhost:8080
   ```

3. **Start Development Server:**
   ```bash
   # From root directory
   pnpm run dev
   ```
   This will start both Backend (port 8080) and Frontend (port 5173) concurrently.

## 🔧 Environment Variables

### Backend (.env)

```env
PORT=8080
NODE_ENV=development

# Security
CORS_ORIGINS=http://localhost:5173,https://your-production-domain.com

# Arbitrage Settings
MIN_ARBITRAGE_PERCENT=0.5
MIN_VOLUME_USD=1000
```

### Frontend (.env)

```env
VITE_WS_URL=http://localhost:8080
```

## 📡 WebSocket Endpoints

| Exchange | Endpoint | Auth Required |
|----------|----------|--------------|
| Binance | `wss://stream.binance.com:9443/ws` | ❌ No |
| Bybit | `wss://stream.bybit.com/v5/ws` | ❌ No |
| Coinbase | `wss://ws-feed.exchange.coinbase.com` | ❌ No |
| Kraken | `wss://ws.kraken.com` | ❌ No |

## 📁 Project Structure

```
arbitrage-platform/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── services/
│   │   │   ├── arbitrage/        # Detection logic
│   │   │   │   ├── detector.ts   # Cross-exchange engine
│   │   │   │   └── triangular.ts # Triangular engine
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks (useWebSocket)
│   │   └── store/                # Zustand store
│   └── package.json
└── README.md
```

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
