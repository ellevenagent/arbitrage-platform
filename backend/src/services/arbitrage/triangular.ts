/**
 * Triangular Arbitrage Service
 * Detects and manages triangular arbitrage opportunities
 * 
 * Triangular arbitrage: Buy A on Exchange 1, convert A→B, sell B on same exchange
 * Example: BTC→ETH→USDT→BTC (all on one exchange)
 */

import { randomUUID } from 'crypto';
import { Server as SocketIOServer } from 'socket.io';

// Configuration
export interface TriangleConfig {
  id: string;
  symbolA: string;  // e.g., BTC
  symbolB: string;  // e.g., ETH
  symbolC: string;  // e.g., USDT
  exchange: string; // Exchange where triangle exists
  enabled: boolean;
  minProfitPercent: number;
  testMode: boolean; // If true, only simulate orders
}

export interface TriangleOpportunity {
  id: string;
  configId: string;
  exchange: string;
  path: string; // "BTC→ETH→USDT→BTC"
  buyPrice: number;  // Price of A in C (e.g., BTC/USDT)
  convertPrice: number; // Price of B in A (e.g., ETH/BTC)
  sellPrice: number; // Price of B in C (e.g., ETH/USDT)
  profitPercent: number;
  estimatedProfit: number;
  timestamp: number;
  simulated: boolean;
}

export class TriangularArbitrageService {
  private io: SocketIOServer;
  
  // Default triangles to monitor
  private triangles: Map<string, TriangleConfig> = new Map();
  
  // Detected opportunities
  private opportunities: TriangleOpportunity[] = [];
  
  // Current prices for all pairs
  private prices: Map<string, Map<string, number>> = new Map(); // exchange -> pair -> price
  
  // Test order execution state
  private testOrdersEnabled: boolean = false;
  private testOrderLogs: string[] = [];

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializeDefaultTriangles();
  }

  private initializeDefaultTriangles(): void {
    const defaults: TriangleConfig[] = [
      {
        id: 'btc-eth-usdt-binance',
        symbolA: 'BTC',
        symbolB: 'ETH',
        symbolC: 'USDT',
        exchange: 'binance',
        enabled: true,
        minProfitPercent: 0.3,
        testMode: true
      },
      {
        id: 'btc-sol-usdt-binance',
        symbolA: 'BTC',
        symbolB: 'SOL',
        symbolC: 'USDT',
        exchange: 'binance',
        enabled: true,
        minProfitPercent: 0.3,
        testMode: true
      },
      {
        id: 'eth-sol-usdt-binance',
        symbolA: 'ETH',
        symbolB: 'SOL',
        symbolC: 'USDT',
        exchange: 'binance',
        enabled: true,
        minProfitPercent: 0.3,
        testMode: true
      },
      {
        id: 'ltc-xrp-usdt-binance',
        symbolA: 'LTC',
        symbolB: 'XRP',
        symbolC: 'USDT',
        exchange: 'binance',
        enabled: true,
        minProfitPercent: 0.4,
        testMode: true
      },
      {
        id: 'xmr-dot-usdt-binance',
        symbolA: 'XMR',
        symbolB: 'DOT',
        symbolC: 'USDT',
        exchange: 'binance',
        enabled: true,
        minProfitPercent: 0.5,
        testMode: true
      },
      {
        id: 'atom-osmo-usdt-binance',
        symbolA: 'ATOM',
        symbolB: 'OSMO',
        symbolC: 'USDT',
        exchange: 'binance',
        enabled: false,
        minProfitPercent: 0.5,
        testMode: true
      },
      {
        id: 'btc-eth-usdt-coinbase',
        symbolA: 'BTC',
        symbolB: 'ETH',
        symbolC: 'USDT',
        exchange: 'coinbase',
        enabled: false,
        minProfitPercent: 0.3,
        testMode: true
      },
      {
        id: 'eth-sol-usdt-kraken',
        symbolA: 'ETH',
        symbolB: 'SOL',
        symbolC: 'USDT',
        exchange: 'kraken',
        enabled: false,
        minProfitPercent: 0.4,
        testMode: true
      }
    ];

    defaults.forEach(t => this.triangles.set(t.id, t));
  }

  // Update prices from WebSocket
  onPriceUpdate(exchange: string, symbol: string, price: number): void {
    if (!this.prices.has(exchange)) {
      this.prices.set(exchange, new Map());
    }
    this.prices.get(exchange)!.set(symbol, price);
    
    // Check for triangular arbitrage opportunities
    this.checkTriangles(exchange);
  }

  private checkTriangles(exchange: string): void {
    const exchangePrices = this.prices.get(exchange);
    if (!exchangePrices) return;

    this.triangles.forEach((config, id) => {
      if (!config.enabled) return;
      if (config.exchange !== exchange) return;

      // Get prices for this triangle
      // A/C = e.g., BTC/USDT
      // B/A = e.g., ETH/BTC  
      // B/C = e.g., ETH/USDT
      const priceAC = exchangePrices.get(`${config.symbolA}/${config.symbolC}`);
      const priceBA = exchangePrices.get(`${config.symbolB}/${config.symbolA}`);
      const priceBC = exchangePrices.get(`${config.symbolB}/${config.symbolC}`);

      if (!priceAC || !priceBA || !priceBC) return;

      // Calculate triangular arbitrage
      // Strategy: Buy A with C, convert A→B, sell B for C
      // Step 1: Buy 1 A at priceAC
      // Step 2: Convert to B at priceBA (how many B per A)
      // Step 3: Sell B at priceBC
      // Result: Should have more C than started if profitable
      
      const step1 = 1 / priceAC; // How many A we get for 1 C
      const step2 = step1 * priceBA; // How many B we get
      const step3 = step2 * priceBC; // How many C we get back
      
      const profitPercent = ((step3 - 1) / 1) * 100;

      if (profitPercent >= config.minProfitPercent) {
        this.detectTriangleOpportunity(config, exchange, profitPercent, step3);
      }
    });
  }

  private detectTriangleOpportunity(
    config: TriangleConfig,
    exchange: string,
    profitPercent: number,
    finalAmount: number
  ): void {
    const opportunity: TriangleOpportunity = {
      id: `tri_${Date.now()}_${randomUUID()}`,
      configId: config.id,
      exchange,
      path: `${config.symbolA}→${config.symbolB}→${config.symbolC}→${config.symbolA}`,
      buyPrice: 1 / finalAmount,
      convertPrice: 1 / finalAmount,
      sellPrice: finalAmount,
      profitPercent,
      estimatedProfit: (finalAmount - 1) * 100, // Assuming 1 unit of C
      timestamp: Date.now(),
      simulated: config.testMode
    };

    this.opportunities.unshift(opportunity);
    this.opportunities = this.opportunities.slice(0, 100); // Keep last 100

    // Emit to frontend
    this.io.emit('triangle:opportunity', opportunity);

    // Execute test order if enabled
    if (this.testOrdersEnabled && config.testMode) {
      this.executeTestOrder(opportunity, config);
    }

    console.log(`🔺 TRIANGLE ARBITRAGE: ${opportunity.path} @ ${exchange}`);
    console.log(`   Profit: ${profitPercent.toFixed(3)}% | ${opportunity.simulated ? '[SIMULATED]' : '[REAL]'}`);
  }

  private executeTestOrder(opp: TriangleOpportunity, config: TriangleConfig): void {
    const log = `[${new Date().toISOString()}] TEST ORDER EXECUTED
  Path: ${opp.path}
  Exchange: ${opp.exchange}
  Profit: ${opp.profitPercent.toFixed(3)}%
  Status: SIMULATED (no real funds used)`;

    this.testOrderLogs.unshift(log);
    this.testOrderLogs = this.testOrderLogs.slice(0, 1000); // Keep last 1000

    this.io.emit('testorder:log', { logs: this.testOrderLogs.slice(0, 50) });
    
    console.log(`🧪 TEST ORDER: ${opp.path} - ${opp.profitPercent.toFixed(3)}%`);
  }

  // Public API methods
  getTriangles(): TriangleConfig[] {
    return Array.from(this.triangles.values());
  }

  getTriangle(id: string): TriangleConfig | undefined {
    return this.triangles.get(id);
  }

  addTriangle(triangle: Omit<TriangleConfig, 'id'>): TriangleConfig {
    const id = `${triangle.symbolA.toLowerCase()}-${triangle.symbolB.toLowerCase()}-${triangle.symbolC.toLowerCase()}-${triangle.exchange}`;
    const config: TriangleConfig = {
      ...triangle,
      id
    };
    this.triangles.set(id, config);
    this.io.emit('triangle:added', config);
    return config;
  }

  updateTriangle(id: string, updates: Partial<TriangleConfig>): TriangleConfig | undefined {
    const existing = this.triangles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, id };
    this.triangles.set(id, updated);
    this.io.emit('triangle:updated', updated);
    return updated;
  }

  removeTriangle(id: string): boolean {
    const deleted = this.triangles.delete(id);
    if (deleted) {
      this.io.emit('triangle:removed', id);
    }
    return deleted;
  }

  toggleTriangle(id: string): TriangleConfig | undefined {
    const existing = this.triangles.get(id);
    if (!existing) return undefined;
    
    existing.enabled = !existing.enabled;
    this.io.emit('triangle:toggled', { id, enabled: existing.enabled });
    return existing;
  }

  enableAllTriangles(): number {
    let count = 0;
    this.triangles.forEach((config) => {
      config.enabled = true;
      count++;
    });
    this.io.emit('triangles:all-enabled', { count });
    return count;
  }

  disableAllTriangles(): number {
    let count = 0;
    this.triangles.forEach((config) => {
      config.enabled = false;
      count++;
    });
    this.io.emit('triangles:all-disabled', { count });
    return count;
  }

  getOpportunities(limit: number = 50): TriangleOpportunity[] {
    return this.opportunities.slice(0, limit);
  }

  getBestOpportunities(limit: number = 10): TriangleOpportunity[] {
    return [...this.opportunities]
      .sort((a, b) => b.profitPercent - a.profitPercent)
      .slice(0, limit);
  }

  // Test orders control
  setTestOrdersEnabled(enabled: boolean): void {
    this.testOrdersEnabled = enabled;
    this.io.emit('testorder:enabled', { enabled });
    console.log(`🧪 Test orders ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  isTestOrdersEnabled(): boolean {
    return this.testOrdersEnabled;
  }

  getTestOrderLogs(limit: number = 50): string[] {
    return this.testOrderLogs.slice(0, limit);
  }

  clearTestOrderLogs(): void {
    this.testOrderLogs = [];
    this.io.emit('testorder:logs-cleared');
  }

  // Statistics
  getStats(): {
    totalTriangles: number;
    enabledTriangles: number;
    totalOpportunities: number;
    avgProfit: number;
    bestProfit: number;
    testOrdersEnabled: boolean;
  } {
    const triangles = Array.from(this.triangles.values());
    const enabled = triangles.filter(t => t.enabled);
    const profits = this.opportunities.map(o => o.profitPercent);
    
    return {
      totalTriangles: triangles.length,
      enabledTriangles: enabled.length,
      totalOpportunities: this.opportunities.length,
      avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      bestProfit: profits.length > 0 ? Math.max(...profits) : 0,
      testOrdersEnabled: this.testOrdersEnabled
    };
  }
}
