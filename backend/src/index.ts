/**
 * Arbitrage Platform - Backend Entry Point
 * Real-time crypto arbitrage detection via WebSockets
 */

import 'dotenv/config';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

import { BinanceWebSocket } from './services/websocket/binance.js';
import { BybitWebSocket } from './services/websocket/bybit.js';
import { CoinbaseWebSocket } from './services/websocket/coinbase.js';
import { KrakenWebSocket } from './services/websocket/kraken.js';
import { RedisPublisher } from './services/redis/publisher.js';
import { ArbitrageDetector } from './services/arbitrage/detector.js';

const PORT = process.env.PORT || 8080;
const app = express();
const server = createServer(app);

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Services
const redis = new RedisPublisher();
const arbitrageDetector = new ArbitrageDetector(redis, io);

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
  redis.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
