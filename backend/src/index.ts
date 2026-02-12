/**
 * Arbitrage Platform - Backend Entry Point
 * Real-time crypto arbitrage detection via WebSockets
 * 
 * Features:
 * - Cross-exchange arbitrage (Binance, Bybit, Coinbase, Kraken)
 * - Triangular arbitrage (BTC→ETH→USDT→BTC, etc.)
 * - Test order execution (simulated)
 * - Real-time WebSocket updates
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
import { TriangularArbitrageService } from './services/arbitrage/triangular.js';

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
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions
});

// Services
const arbitrageDetector = new ArbitrageDetector(io);
const triangularService = new TriangularArbitrageService(io);

// Connect triangular service to detector for price forwarding
import { setTriangularService } from './services/arbitrage/detector.js';
setTriangularService(triangularService);

// WebSocket Connections
const wsConnections = {
  binance: new BinanceWebSocket(arbitrageDetector),
  bybit: new BybitWebSocket(arbitrageDetector),
  coinbase: new CoinbaseWebSocket(arbitrageDetector),
  kraken: new KrakenWebSocket(arbitrageDetector)
};

// ============ API ENDPOINTS ============

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
    crossExchange: arbitrageDetector.getStats(),
    triangular: triangularService.getStats(),
    connections: {
      binance: wsConnections.binance.getStats(),
      bybit: wsConnections.bybit.getStats(),
      coinbase: wsConnections.coinbase.getStats(),
      kraken: wsConnections.kraken.getStats()
    }
  });
});

// Cross-exchange opportunities
app.get('/api/opportunities', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json(arbitrageDetector.getOpportunities().slice(0, limit));
});

// Prices
app.get('/api/prices', (req, res) => {
  const symbol = req.query.symbol as string;
  res.json(arbitrageDetector.getPrices(symbol));
});

// ============ TRIANGULAR ARBITRAGE ENDPOINTS ============

// Get all triangles
app.get('/api/triangles', (req, res) => {
  res.json(triangularService.getTriangles());
});

// Get best opportunities
app.get('/api/triangles/opportunities', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  res.json(triangularService.getBestOpportunities(limit));
});

// Add new triangle
app.post('/api/triangles', (req, res) => {
  try {
    const triangle = triangularService.addTriangle(req.body);
    res.json(triangle);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update triangle
app.put('/api/triangles/:id', (req, res) => {
  const triangle = triangularService.updateTriangle(req.params.id, req.body);
  if (!triangle) {
    return res.status(404).json({ error: 'Triangle not found' });
  }
  res.json(triangle);
});

// Delete triangle
app.delete('/api/triangles/:id', (req, res) => {
  const deleted = triangularService.removeTriangle(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Triangle not found' });
  }
  res.json({ success: true });
});

// Toggle triangle
app.post('/api/triangles/:id/toggle', (req, res) => {
  const triangle = triangularService.toggleTriangle(req.params.id);
  if (!triangle) {
    return res.status(404).json({ error: 'Triangle not found' });
  }
  res.json(triangle);
});

// Enable/disable all triangles
app.post('/api/triangles/enable-all', (req, res) => {
  const count = triangularService.enableAllTriangles();
  res.json({ enabled: count });
});

app.post('/api/triangles/disable-all', (req, res) => {
  const count = triangularService.disableAllTriangles();
  res.json({ disabled: count });
});

// ============ TEST ORDERS ENDPOINTS ============

// Get test order status
app.get('/api/testorders/status', (req, res) => {
  res.json({
    enabled: triangularService.isTestOrdersEnabled(),
    logs: triangularService.getTestOrderLogs(50)
  });
});

// Enable/disable test orders
app.post('/api/testorders/:action', (req, res) => {
  const action = req.params.action;
  if (action === 'enable') {
    triangularService.setTestOrdersEnabled(true);
    res.json({ enabled: true });
  } else if (action === 'disable') {
    triangularService.setTestOrdersEnabled(false);
    res.json({ enabled: false });
  } else {
    res.status(400).json({ error: 'Invalid action. Use enable or disable' });
  }
});

// Clear test order logs
app.delete('/api/testorders/logs', (req, res) => {
  triangularService.clearTestOrderLogs();
  res.json({ success: true });
});

// ============ START SERVER ============

server.listen(PORT, () => {
  console.log(`🚀 Arbitrage Platform Backend running on port ${PORT}`);
  console.log(`📊 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔌 REST API: http://localhost:${PORT}`);
  console.log(`\n📈 Cross-Exchange Arbitrage: Active`);
  console.log(`🔺 Triangular Arbitrage: Active (${triangularService.getTriangles().length} triangles)`);
  console.log(`🧪 Test Orders: ${triangularService.isTestOrdersEnabled() ? 'Enabled' : 'Disabled'}`);
  
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
