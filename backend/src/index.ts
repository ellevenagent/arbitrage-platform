/**
 * Arbitrage Platform - Backend Entry Point
 * Real-time crypto arbitrage detection via WebSockets
 * 
 * Redis: Not used - Socket.IO handles all real-time communication
 * For Redis persistence, add @upstash/redis later
 */

import 'dotenv/config';

// WebSocket polyfill for Node.js
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = (await import('ws')).WebSocket;
}
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { BinanceWebSocket } from './services/websocket/binance.js';
import { BybitWebSocket } from './services/websocket/bybit.js';
import { CoinbaseWebSocket } from './services/websocket/coinbase.js';
import { KrakenWebSocket } from './services/websocket/kraken.js';
import { ArbitrageDetector } from './services/arbitrage/detector.js';

const PORT = process.env.PORT || 8080;
const app = express();
const server = createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // React dev server
  'http://localhost:8080',  // Backend direct
  // Adicionar domínios de produção aqui quando fizer deploy
];

// Security: Helmet headers
app.use(helmet());

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS - restricted to allowed origins
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};
app.use(cors(corsOptions));

// Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions
});

// Services
const arbitrageDetector = new ArbitrageDetector(io);

// WebSocket Connections
const wsConnections = {
  binance: new BinanceWebSocket(arbitrageDetector),
  bybit: new BybitWebSocket(arbitrageDetector),
  coinbase: new CoinbaseWebSocket(arbitrageDetector),
  kraken: new KrakenWebSocket(arbitrageDetector)
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: {
      binance: wsConnections.binance.isConnected,
      bybit: wsConnections.bybit.isConnected,
      coinbase: wsConnections.coinbase.isConnected,
      kraken: wsConnections.kraken.isConnected
    },
    timestamp: new Date().toISOString()
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    arbitrageOpportunities: arbitrageDetector.getStats(),
    connections: {
      binance: wsConnections.binance.getStats(),
      bybit: wsConnections.bybit.getStats(),
      coinbase: wsConnections.coinbase.getStats(),
      kraken: wsConnections.kraken.getStats()
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Arbitrage Platform Backend running on port ${PORT}`);
  console.log(`📊 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔌 REST API: http://localhost:${PORT}/health`);
  console.log(`💾 Redis: Not used (Socket.IO for real-time only)`);
  
  // Connect WebSockets
  console.log('\n📡 Connecting to exchanges...');
  wsConnections.binance.connect();
  wsConnections.bybit.connect();
  wsConnections.coinbase.connect();
  wsConnections.kraken.connect();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  Object.values(wsConnections).forEach(ws => ws.disconnect());
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
