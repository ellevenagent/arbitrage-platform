/**
 * Kraken WebSocket Service
 * Real-time price streaming from Kraken
 * 
 * Public WebSocket - No API Key required for price data
 * Endpoint: wss://ws.kraken.com
 */

import { ArbitrageDetector } from '../arbitrage/detector.js';

interface KrakenTicker {
  c: string[];  // Close price + volume
  v: string[];   // Volume today + 24h
  p: string[];  // Volume weighted avg price today + 24h
  t: number[];  // Trades today + 24h
  l: string[];  // Low today + 24h
  h: string[];  // High today + 24h
  o: string;    // Open price today
}

interface KrakenMessage {
  event?: string;
  pair?: string[];
  subscription?: { name: string };
  data?: KrakenTicker[];
}

export class KrakenWebSocket {
  private ws: WebSocket | null = null;
  private detector: ArbitrageDetector;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private pairs = [
    'XBT/USDT',
    'ETH/USDT',
    'SOL/USDT',
    'BNB/USDT',
    'XRP/USDT',
    'ADA/USDT',
    'DOGE/USDT',
    'DOT/USDT',
    'LINK/USDT',
    'MATIC/USDT'
  ];

  constructor(detector: ArbitrageDetector) {
    this.detector = detector;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): void {
    const url = 'wss://ws.kraken.com';
    
    console.log(`🔌 Connecting to Kraken WebSocket...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Kraken WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to ticker for each pair
        const subscribeMsg = {
          event: 'subscribe',
          pair: this.pairs,
          subscription: { name: 'ticker' }
        };
        this.ws!.send(JSON.stringify(subscribeMsg));
        
        this.detector.onExchangeConnect('kraken');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Skip heartbeat/event messages
          if (data.event) return;
          
          // Kraken returns arrays: [tickerData, pairName, ...]
          if (Array.isArray(data) && data.length >= 3) {
            const tickerData = data[1] as KrakenTicker;
            const pairName = data[3] as string || data[2] as string;
            this.processTicker(tickerData, pairName);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Kraken WebSocket error:', error.message);
      };

      this.ws.onclose = () => {
        console.log('🔌 Kraken WebSocket disconnected');
        this.detector.onExchangeDisconnect('kraken');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Failed to connect to Kraken:', error);
      this.attemptReconnect();
    }
  }

  private processTicker(data: KrakenTicker, pairName: string): void {
    if (!data.c || !data.c[0]) return;

    const price = parseFloat(data.c[0]);
    const volume = parseFloat(data.c[1] || '0');
    const change24h = data.p && data.p[1] ? ((price - parseFloat(data.p[1])) / parseFloat(data.p[1])) * 100 : 0;

    // Convert XBT to BTC and normalize format
    let symbol = pairName.replace('XBT', 'BTC').replace('/', '/USDT').toUpperCase();

    this.detector.onPriceUpdate({
      exchange: 'kraken',
      symbol: symbol,
      price: price,
      change24h: change24h,
      volume: volume,
      timestamp: Date.now()
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for Kraken');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to Kraken (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
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
      symbols: this.pairs.length
    };
  }
}
