import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Triangle, Plus, Trash2, Play, Pause, BarChart3, Zap, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

interface TriangleConfig {
  id: string;
  symbolA: string;
  symbolB: string;
  symbolC: string;
  exchange: string;
  enabled: boolean;
  minProfitPercent: number;
  testMode: boolean;
}

interface TriangleOpportunity {
  id: string;
  configId: string;
  exchange: string;
  path: string;
  buyPrice: number;
  convertPrice: number;
  sellPrice: number;
  profitPercent: number;
  estimatedProfit: number;
  timestamp: number;
  simulated: boolean;
}

interface PriceUpdate {
  exchange: string;
  symbol: string;
  price: number;
  change24h: number;
}

interface TrianglePrice {
  priceAC: number;
  priceBA: number;
  priceBC: number;
  lastUpdate: number;
}

export function TriangularArbitrage() {
  const [triangles, setTriangles] = useState<TriangleConfig[]>([]);
  const [opportunities, setOpportunities] = useState<TriangleOpportunity[]>([]);
  const [testOrdersEnabled, setTestOrdersEnabled] = useState(false);
  const [testOrderLogs, setTestOrderLogs] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    totalTriangles: 0,
    enabledTriangles: 0,
    totalOpportunities: 0,
    avgProfit: 0,
    bestProfit: 0
  });

  // Real-time prices for triangles
  const [trianglePrices, setTrianglePrices] = useState<Map<string, TrianglePrice>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // New triangle form
  const [newTriangle, setNewTriangle] = useState({
    symbolA: '',
    symbolB: '',
    symbolC: '',
    exchange: 'binance',
    minProfitPercent: 0.3,
    testMode: true
  });

  useEffect(() => {
    fetchTriangles();
    fetchOpportunities();
    fetchTestOrderStatus();
    fetchStats();

    // WebSocket connection
    const socket: Socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
    });

    // Real-time price updates
    socket.on('price:update', (data: PriceUpdate) => {
      updateTrianglePrices(data);
      setLastUpdate(new Date());
    });

    // Triangle opportunities
    socket.on('triangle:opportunity', (data: TriangleOpportunity) => {
      setOpportunities(prev => [data, ...prev.slice(0, 49)]);
      fetchStats();
    });

    // Triangle management
    socket.on('triangle:added', () => {
      fetchTriangles();
      fetchStats();
    });
    socket.on('triangle:updated', () => {
      fetchTriangles();
      fetchStats();
    });
    socket.on('triangle:removed', () => {
      fetchTriangles();
      fetchStats();
    });
    socket.on('triangle:toggled', () => {
      fetchTriangles();
      fetchStats();
    });
    socket.on('triangles:all-enabled', () => {
      fetchTriangles();
      fetchStats();
    });
    socket.on('triangles:all-disabled', () => {
      fetchTriangles();
      fetchStats();
    });

    // Test orders
    socket.on('testorder:enabled', (data: { enabled: boolean }) => {
      setTestOrdersEnabled(data.enabled);
    });
    socket.on('testorder:log', (data: { logs?: string[] }) => {
      setTestOrderLogs(data.logs || []);
    });
    socket.on('testorder:logs-cleared', () => {
      setTestOrderLogs([]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateTrianglePrices = (data: PriceUpdate) => {
    const { exchange, symbol, price } = data;
    
    setTrianglePrices(prev => {
      const key = `${exchange}:${symbol}`;
      const updated = new Map(prev);
      
      // Update relevant pairs for triangles
      triangles.forEach(tri => {
        const pairAC = `${tri.symbolA}/${tri.symbolC}`;
        const pairBA = `${tri.symbolB}/${tri.symbolA}`;
        const pairBC = `${tri.symbolB}/${tri.symbolC}`;
        
        if (symbol === pairAC || symbol === pairBA || symbol === pairBC) {
          const triKey = `${tri.exchange}:${tri.id}`;
          const current = updated.get(triKey) || { priceAC: 0, priceBA: 0, priceBC: 0, lastUpdate: Date.now() };
          
          if (symbol === pairAC) current.priceAC = price;
          if (symbol === pairBA) current.priceBA = price;
          if (symbol === pairBC) current.priceBC = price;
          current.lastUpdate = Date.now();
          
          updated.set(triKey, current);
        }
      });
      
      return updated;
    });
  };

  const fetchTriangles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/triangles`);
      const data = await res.json();
      setTriangles(data);
    } catch (error) {
      console.error('Error fetching triangles:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/triangles/opportunities?limit=20`);
      const data = await res.json();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const fetchTestOrderStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/testorders/status`);
      const data = await res.json();
      setTestOrdersEnabled(data.enabled);
      setTestOrderLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching test order status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data.triangular || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleTriangle = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/triangles/${id}/toggle`, { method: 'POST' });
    } catch (error) {
      console.error('Error toggling triangle:', error);
    }
  };

  const deleteTriangle = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/triangles/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting triangle:', error);
    }
  };

  const enableAll = async () => {
    try {
      await fetch(`${API_URL}/api/triangles/enable-all`, { method: 'POST' });
    } catch (error) {
      console.error('Error enabling all triangles:', error);
    }
  };

  const disableAll = async () => {
    try {
      await fetch(`${API_URL}/api/triangles/disable-all`, { method: 'POST' });
    } catch (error) {
      console.error('Error disabling all triangles:', error);
    }
  };

  const toggleTestOrders = async () => {
    try {
      const action = testOrdersEnabled ? 'disable' : 'enable';
      await fetch(`${API_URL}/api/testorders/${action}`, { method: 'POST' });
      setTestOrdersEnabled(!testOrdersEnabled);
    } catch (error) {
      console.error('Error toggling test orders:', error);
    }
  };

  const addTriangle = async () => {
    try {
      await fetch(`${API_URL}/api/triangles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTriangle)
      });
      setShowAddModal(false);
      setNewTriangle({
        symbolA: '',
        symbolB: '',
        symbolC: '',
        exchange: 'binance',
        minProfitPercent: 0.3,
        testMode: true
      });
    } catch (error) {
      console.error('Error adding triangle:', error);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  };

  const getExchangeColor = (exchange: string) => {
    const colors: Record<string, string> = {
      binance: 'text-yellow-400',
      bybit: 'text-blue-400',
      coinbase: 'text-blue-500',
      kraken: 'text-purple-400'
    };
    return colors[exchange] || 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Triangle className="text-purple-400" size={20} />
            Triangular Arbitrage
          </h2>
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <RefreshCw size={12} />
            Atualizado: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-lg font-bold text-white">{stats.totalTriangles}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs">Ativos</p>
          <p className="text-lg font-bold text-green-400">{stats.enabledTriangles}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs">Oportunidades</p>
          <p className="text-lg font-bold text-white">{stats.totalOpportunities}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs">Média</p>
          <p className="text-lg font-bold text-blue-400">{stats.avgProfit.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs">Melhor</p>
          <p className="text-lg font-bold text-green-400">{stats.bestProfit.toFixed(2)}%</p>
        </div>
      </div>

      {/* Test Orders Control */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className={testOrdersEnabled ? 'text-yellow-400' : 'text-gray-400'} />
            <div>
              <p className="text-white text-sm font-medium">Test Orders</p>
              <p className="text-gray-400 text-xs">
                {testOrdersEnabled ? '🧪 Simulando automaticamente' : 'Pausado'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTestOrders}
            className={`px-3 py-1 rounded text-sm ${
              testOrdersEnabled
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {testOrdersEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
        {testOrderLogs.length > 0 && (
          <div className="mt-2 bg-gray-900/50 rounded p-2 max-h-20 overflow-y-auto">
            <p className="text-gray-500 text-xs mb-1">Logs recentes:</p>
            {testOrderLogs.slice(0, 3).map((log, i) => (
              <div key={i} className="text-xs text-gray-300 font-mono truncate">
                {log.split('\n')[0]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2">
        <button
          onClick={enableAll}
          className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30"
        >
          Enable All
        </button>
        <button
          onClick={disableAll}
          className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30"
        >
          Disable All
        </button>
      </div>

      {/* Compact Triangle Cards Grid */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
        <h3 className="text-sm font-bold text-white mb-2">Triângulos Monitorados</h3>
        
        {triangles.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nenhum triângulo configurado</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {triangles.map((triangle) => {
              const prices = trianglePrices.get(`${triangle.exchange}:${triangle.id}`);
              const hasPrices = prices && prices.priceAC > 0 && prices.priceBA > 0 && prices.priceBC > 0;
              
              return (
                <div
                  key={triangle.id}
                  className={`bg-gray-700/30 border rounded-lg p-2 ${
                    triangle.enabled
                      ? 'border-gray-600/50'
                      : 'border-gray-700/30 opacity-50'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleTriangle(triangle.id)}
                        className="p-1 hover:bg-gray-600/50 rounded"
                      >
                        {triangle.enabled ? (
                          <Play size={12} className="text-green-400" />
                        ) : (
                          <Pause size={12} className="text-gray-400" />
                        )}
                      </button>
                      <span className={`text-xs font-medium capitalize ${getExchangeColor(triangle.exchange)}`}>
                        {triangle.exchange}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTriangle(triangle.id)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 size={10} className="text-red-400" />
                    </button>
                  </div>

                  {/* Path */}
                  <p className="text-xs text-white font-mono mb-1 truncate">
                    {triangle.symbolA}→{triangle.symbolB}→{triangle.symbolC}→{triangle.symbolA}
                  </p>

                  {/* Real-time Prices */}
                  {hasPrices ? (
                    <div className="space-y-0.5 mb-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{triangle.symbolA}/{triangle.symbolC}:</span>
                        <span className="text-white font-mono">{formatPrice(prices.priceAC)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{triangle.symbolB}/{triangle.symbolA}:</span>
                        <span className="text-white font-mono">{formatPrice(prices.priceBA)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{triangle.symbolB}/{triangle.symbolC}:</span>
                        <span className="text-white font-mono">{formatPrice(prices.priceBC)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mb-1">Aguardando preços...</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Min: {triangle.minProfitPercent}%</span>
                    {triangle.testMode && (
                      <span className="text-yellow-400">🧪</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Best Opportunities */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-1">
            <BarChart3 size={14} className="text-green-400" />
            Melhores Oportunidades
          </h3>
          <button
            onClick={fetchOpportunities}
            className="p-1 hover:bg-gray-700/50 rounded"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>

        {opportunities.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-2">Nenhuma oportunidade detectada</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {opportunities.slice(0, 10).map((opp) => (
              <div
                key={opp.id}
                className="bg-gray-700/30 border border-gray-600/50 rounded p-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs capitalize ${getExchangeColor(opp.exchange)}`}>
                    {opp.exchange}
                  </span>
                  <span className={`text-xs font-bold ${
                    opp.profitPercent > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {opp.profitPercent > 0 ? '+' : ''}{opp.profitPercent.toFixed(3)}%
                  </span>
                </div>
                <p className="text-xs text-gray-300 truncate">{opp.path}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(opp.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-yellow-400">
                    {opp.simulated ? '🧪' : '💰'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Triangle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Novo Triângulo</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['symbolA', 'symbolB', 'symbolC'].map((field, i) => (
                  <div key={field}>
                    <label className="block text-gray-400 text-xs mb-1">
                      {field.replace('symbol', 'Symbol ')} (e.g. BTC)
                    </label>
                    <input
                      type="text"
                      value={newTriangle[field as keyof typeof newTriangle] as string}
                      onChange={(e) => setNewTriangle({ 
                        ...newTriangle, 
                        [field]: e.target.value.toUpperCase() 
                      })}
                      placeholder={i === 2 ? 'USDT' : ''}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">Exchange</label>
                <select
                  value={newTriangle.exchange}
                  onChange={(e) => setNewTriangle({ ...newTriangle, exchange: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                >
                  <option value="binance">Binance</option>
                  <option value="bybit">Bybit</option>
                  <option value="coinbase">Coinbase</option>
                  <option value="kraken">Kraken</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs mb-1">
                  Min Profit: {newTriangle.minProfitPercent}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={newTriangle.minProfitPercent}
                  onChange={(e) => setNewTriangle({ 
                    ...newTriangle, 
                    minProfitPercent: parseFloat(e.target.value) 
                  })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="testMode"
                  checked={newTriangle.testMode}
                  onChange={(e) => setNewTriangle({ ...newTriangle, testMode: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="testMode" className="text-gray-300 text-sm">🧪 Modo Teste</label>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
              >
                Cancelar
              </button>
              <button
                onClick={addTriangle}
                disabled={!newTriangle.symbolA || !newTriangle.symbolB || !newTriangle.symbolC}
                className="flex-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
