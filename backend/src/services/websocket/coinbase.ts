/**
 * Coinbase WebSocket Service
 * Real-time price streaming from Coinbase
 * 
 * Public WebSocket - No API Key required for price data
 * Endpoint: wss://ws-feed.exchange.coinbase.com
 */

import { ArbitrageDetector } from '../arbitrage/detector.js';

interface CoinbaseTicker {
  trade_id?: number;
  price: string;
  size?: string;
  bid?: string;
  ask?: string;
  volume_24h?: string;
  time?: string;
}

interface CoinbaseMessage {
  type: string;
  product_ids?: string[];
  channels?: string[];
  ticker?: CoinbaseTicker;
  product_id?: string;
}

export class CoinbaseWebSocket {
  private ws: WebSocket | null = null;
  private detector: ArbitrageDetector;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private products = [
    'BTC-USD',
    'ETH-USD',
    'SOL-USD',
    'BNB-USD',
    'XRP-USD',
    'ADA-USD',
    'DOGE-USD',
    'DOT-USD',
    'LINK-USD',
    'MATIC-USD'
  ];

  constructor(detector: ArbitrageDetector) {
    this.detector = detector;
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  connect(): void {
    const url = 'wss://ws-feed.exchange.coinbase.com';
    
    console.log(`🔌 Connecting to Coinbase WebSocket...`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ Coinbase WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to ticker channels
        const subscribeMsg: CoinbaseMessage = {
          type: 'subscribe',
          product_ids: this.products,
          channels: ['ticker']
        };
        this.ws!.send(JSON.stringify(subscribeMsg));
        
        this.detector.onExchangeConnect('coinbase');
      };

      this.ws.onmessage = (event) => {
        try {
          const data: CoinbaseMessage = JSON.parse(event.data);
          
          if (data.type === 'ticker' && data.ticker && data.product_id) {
            this.processTicker(data.ticker, data.product_id);
          }
        } catch (error) {
          // Ignore non-ticker messages
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Coinbase WebSocket error:', error.message);
      };

      this.ws.onclose = () => {
        console.log('🔌 Coinbase WebSocket disconnected');
        this.detector.onExchangeDisconnect('coinbase');
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Failed to connect to Coinbase:', error);
      this.attemptReconnect();
    }
  }

  private processTicker(ticker: CoinbaseTicker, productId: string): void {
    const price = parseFloat(ticker.price);
    const volume = parseFloat(ticker.volume_24h || '0');
    
    // Convert XXX-USD to XXX/USDT for consistency
    let symbol = productId.replace('-USD', '').toUpperCase();
    symbol = symbol + '/USDT'; // Use USDT format for consistency

    // Calculate 24h change from bid/ask if not provided
    let change24h = 0;
    if (ticker.bid && ticker.ask) {
      const midPrice = (parseFloat(ticker.bid) + parseFloat(ticker.ask)) / 2;
      change24h = ((price - midPrice) / midPrice) * 100;
    }

    this.detector.onPriceUpdate({
      exchange: 'coinbase',
      symbol: symbol,
      price: price,
      change24h: change24h,
      volume: volume,
      timestamp: Date.now()
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached for Coinbase');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting to Coinbase (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
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
      symbols: this.products.length
    };
  }
}
