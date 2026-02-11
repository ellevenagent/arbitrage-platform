/**
 * Binance WebSocket Service
 * Real-time price streaming from Binance
 * 
 * Public WebSocket - No API Key required for price data
 * Endpoint: wss://stream.binance.com:9443/ws
 */

import { ArbitrageDetector } from '../arbitrage/detector.js';

interface BinanceTicker {
  s: string;  // Symbol
  c: string;   // Close price
  p: string;  // Price change
  q: string;  // Quote volume
  t: number;  // Trade time
}

export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private detector: ArbitrageDetector;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  constructor(detector: ArbitrageDetector) {
    this.detector = detector;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): void {
    // Subscribe to all mini tickers
    const streams = [
      'btcusdt@ticker',
      'ethusdt@ticker',
      'solusdt@ticker',
      'bnbusdt@ticker',
      'xrpusdt@ticker',
      'adausdt@ticker',
      'dogeusdt@ticker',
      'dotusdt@ticker',
      'linkusdt@ticker',
      'maticusdt@ticker'
    ].join('/');

    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    console.log(`🔌 Connecting to Binance WebSocket...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Binance WebSocket connected');
        this.reconnectAttempts = 0;
        this.detector.onExchangeConnect('binance');
      };

      this.ws.onmessage = (event) => {
        try {
          const data: BinanceTicker = JSON.parse(event.data);
          this.processTicker(data);
        } catch (error) {
          // Ignore heartbeat messages
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Binance WebSocket error:', error.message);
      };

      this.ws.onclose = () => {
        console.log('🔌 Binance WebSocket disconnected');
        this.detector.onExchangeDisconnect('binance');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Failed to connect to Binance:', error);
      this.attemptReconnect();
    }
  }

  private processTicker(data: BinanceTicker): void {
    if (!data.s || !data.c) return;

    const symbol = data.s.replace('USDT', '').replace('BTC', '').toUpperCase();
    const price = parseFloat(data.c);
    const change24h = parseFloat(data.p);
    const volume = parseFloat(data.q);

    // Only emit for main trading pairs
    const mainPairs = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'MATIC'];
    
    if (mainPairs.includes(symbol)) {
      this.detector.onPriceUpdate({
        exchange: 'binance',
        symbol: symbol + '/USDT',
        price: price,
        change24h: change24h,
        volume: volume,
        timestamp: Date.now()
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for Binance');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to Binance (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => this.connect(), this.reconnectDelay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getStats(): { connected: boolean; symbols: number } {
    return {
      connected: this.isConnected,
      symbols: 10 // BTC, ETH, SOL, BNB, XRP, ADA, DOGE, DOT, LINK, MATIC
    };
  }
}
