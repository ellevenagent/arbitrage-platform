import { create } from 'zustand';

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

interface AppState {
  // Connection status
  isConnected: boolean;
  setConnectionStatus: (status: boolean) => void;
  
  // Prices
  prices: Map<string, PriceData[]>;
  setPrices: (data: PriceData) => void;
  getPrice: (symbol: string) => PriceData | undefined;
  
  // Opportunities
  opportunities: ArbitrageOpportunity[];
  setOpportunities: (data: ArbitrageOpportunity) => void;
  
  // Stats
  stats: {
    opportunities: number;
    symbols: number;
    exchanges: Record<string, boolean>;
  };
  setStats: (stats: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  isConnected: false,
  setConnectionStatus: (status) => set({ isConnected: status }),
  
  prices: new Map(),
  setPrices: (data) => {
    const { prices } = get();
    const symbol = data.symbol;
    const symbolPrices = prices.get(symbol) || [];
    
    // Update or add price
    const existingIndex = symbolPrices.findIndex(
      (p) => p.exchange === data.exchange
    );
    
    if (existingIndex >= 0) {
      symbolPrices[existingIndex] = data;
    } else {
      symbolPrices.push(data);
    }
    
    prices.set(symbol, symbolPrices);
    set({ prices: new Map(prices) });
  },
  getPrice: (symbol) => {
    const { prices } = get();
    const symbolPrices = prices.get(symbol);
    if (!symbolPrices || symbolPrices.length === 0) return undefined;
    
    // Return cheapest price
    return symbolPrices.reduce((min, p) => 
      p.price < min.price ? p : min
    );
  },
  
  opportunities: [],
  setOpportunities: (data) => {
    const { opportunities } = get();
    // Add new opportunity at the beginning
    const updated = [data, ...opportunities].slice(0, 50); // Keep last 50
    set({ opportunities: updated });
  },
  
  stats: {
    opportunities: 0,
    symbols: 0,
    exchanges: {
      binance: false,
      bybit: false,
      coinbase: false,
      kraken: false,
    },
  },
  setStats: (stats) => set({ stats }),
}));
