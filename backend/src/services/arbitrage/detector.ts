/**
 * Arbitrage Detection Engine
 * Detects cross-exchange and triangular arbitrage opportunities
 */

import { Server as SocketIOServer } from 'socket.io';
import { RedisPublisher } from '../redis/publisher.js';

interface PriceData {
  exchange: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
}

interface ArbitrageOpportunity {
  id: string;
  type: 'cross-exchange' | 'triangular';
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  volume: number;
  timestamp: number;
  status: 'detected' | 'executed' | 'expired';
}

interface ExchangeStats {
  connected: boolean;
  lastUpdate: number | null;
}

export class ArbitrageDetector {
  private redis: RedisPublisher;
  private io: SocketIOServer;
  
  // Price storage: symbol -> exchange -> price
  private prices: Map<string, Map<string, PriceData>> = new Map();
  
  private exchangeStats: Map<string, ExchangeStats> = new Map();
  private opportunities: ArbitrageOpportunity[] = [];
  private minArbitragePercent: number;
  private minVolumeUSD: number;

  constructor(redis: RedisPublisher, io: SocketIOServer) {
    this.redis = redis;
    this.io = io;
    this.minArbitragePercent = parseFloat(process.env.MIN_ARBITRAGE_PERCENT || '0.5');
    this.minVolumeUSD = parseFloat(process.env.MIN_VOLUME_USD || '1000');
    
    // Initialize exchange stats
    ['binance', 'bybit', 'coinbase', 'kraken'].forEach(ex => {
      this.exchangeStats.set(ex, { connected: false, lastUpdate: null });
    });
  }

  onPriceUpdate(data: PriceData): void {
    // Update prices map
    if (!this.prices.has(data.symbol)) {
      this.prices.set(data.symbol, new Map());
    }
    this.prices.get(data.symbol)!.set(data.exchange, data);
    
    // Update exchange stats
    this.exchangeStats.get(data.exchange)!.lastUpdate = Date.now();
    
    // Emit real-time price update
    this.io.emit('price:update', data);
    
    // Store in Redis for persistence
    this.redis.publishPrice(data);
    
    // Check for arbitrage
    this.checkArbitrage(data.symbol);
  }

  onExchangeConnect(exchange: string): void {
    this.exchangeStats.get(exchange)!.connected = true;
    this.io.emit('exchange:status', { exchange, connected: true });
    console.log(`📊 ${exchange} connected`);
  }

  onExchangeDisconnect(exchange: string): void {
    this.exchangeStats.get(exchange)!.connected = false;
    this.io.emit('exchange:status', { exchange, connected: false });
    console.log(`📊 ${exchange} disconnected`);
  }

  private checkArbitrage(symbol: string): void {
    const symbolPrices = this.prices.get(symbol);
    if (!symbolPrices || symbolPrices.size < 2) return;

    // Cross-exchange arbitrage detection
    const exchanges = Array.from(symbolPrices.values());
    
    for (let i = 0; i < exchanges.length; i++) {
      for (let j = i + 1; j < exchanges.length; j++) {
        const buy = exchanges[i];
        const sell = exchanges[j];
        
        // Buy on exchange with lower price
        const [lower, higher] = buy.price < sell.price 
          ? [buy, sell] 
          : [sell, buy];
        
        const profitPercent = ((higher.price - lower.price) / lower.price) * 100;
        
        if (profitPercent >= this.minArbitragePercent) {
          // Check volume
          if (buy.volume >= this.minVolumeUSD && sell.volume >= this.minVolumeUSD) {
            this.detectCrossExchangeArbitrage(buy, higher, profitPercent);
          }
        }
      }
    }
  }

  private detectCrossExchangeArbitrage(
    buy: PriceData, 
    sell: PriceData, 
    profitPercent: number
  ): void {
    const opportunity: ArbitrageOpportunity = {
      id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'cross-exchange',
      symbol: buy.symbol,
      buyExchange: buy.exchange,
      sellExchange: sell.exchange,
      buyPrice: buy.price,
      sellPrice: sell.price,
      profitPercent: profitPercent,
      volume: Math.min(buy.volume, sell.volume),
      timestamp: Date.now(),
      status: 'detected'
    };

    this.opportunities.push(opportunity);
    
    // Emit to frontend
    this.io.emit('arbitrage:opportunity', opportunity);
    
    // Store in Redis
    this.redis.publishArbitrage(opportunity);
    
    console.log(`🚀 ARBITRAGE DETECTED:
      ${buy.symbol}: ${buy.exchange.toUpperCase()} $${buy.price} → ${sell.exchange.toUpperCase()} $${sell.price}
      Profit: ${profitPercent.toFixed(2)}%
    `);
  }

  getStats(): {
    opportunities: number;
    exchanges: Record<string, ExchangeStats>;
    symbols: number;
  } {
    return {
      opportunities: this.opportunities.filter(o => o.status === 'detected').length,
      exchanges: Object.fromEntries(this.exchangeStats),
      symbols: this.prices.size
    };
  }

  getOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities.slice(-50).reverse(); // Last 50
  }

  getPrices(symbol?: string): Record<string, PriceData[]> {
    if (symbol) {
      const symPrices = this.prices.get(symbol);
      return symPrices 
        ? { [symbol]: Array.from(symPrices.values()) } 
        : {};
    }
    
    // Return all prices
    const result: Record<string, PriceData[]> = {};
    this.prices.forEach((prices, sym) => {
      result[sym] = Array.from(prices.values());
    });
    return result;
  }
}
