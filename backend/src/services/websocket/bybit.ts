/**
 * Bybit WebSocket Service
 * Real-time price streaming from Bybit
 * 
 * Public WebSocket - No API Key required for price data
 * Endpoint: wss://stream.bybit.com/v5/ws
 */

import { ArbitrageDetector } from '../arbitrage/detector.js';

interface BybitTicker {
  s: string;  // Symbol
  c: string;  // Close price
  p: string;  // Price change 24h
  v: string;  // Volume 24h
  t: number;  // Timestamp
}

export class BybitWebSocket {
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
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT'];
    
    const url = 'wss://stream.bybit.com/v5/ws';
    
    console.log(`🔌 Connecting to Bybit WebSocket...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Bybit WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to tickers
        const subscribeMsg = {
          op: 'subscribe',
          args: symbols.map(s => `tickers.${s}`)
        };
        this.ws!.send(JSON.stringify(subscribeMsg));
        
        this.detector.onExchangeConnect('bybit');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.topic && data.topic.startsWith('tickers.')) {
            const ticker: BybitTicker = data.data;
            this.processTicker(ticker);
          }
        } catch (error) {
          // Ignore non-ticker messages
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Bybit WebSocket error:', error.message);
      };

      this.ws.onclose = () => {
        console.log('🔌 Bybit WebSocket disconnected');
        this.detector.onExchangeDisconnect('bybit');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Failed to connect to Bybit:', error);
      this.attemptReconnect();
    }
  }

  private processTicker(data: BybitTicker): void {
    if (!data.s || !data.c) return;

    const symbol = data.s.replace('USDT', '').toUpperCase();
    const price = parseFloat(data.c);
    const change24h = parseFloat(data.p);
    const volume = parseFloat(data.v);

    this.detector.onPriceUpdate({
      exchange: 'bybit',
      symbol: symbol + '/USDT',
      price: price,
      change24h: change24h,
      volume: volume,
      timestamp: data.t || Date.now()
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for Bybit');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to Bybit (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
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
      symbols: 10
    };
  }
}
