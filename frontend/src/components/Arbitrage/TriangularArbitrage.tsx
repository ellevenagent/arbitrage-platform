import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Triangle, Plus, Trash2, Play, Pause, BarChart3, Zap } from 'lucide-react';

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
  profitPercent: number;
  estimatedProfit: number;
  timestamp: number;
  simulated: boolean;
}

interface TestOrderLog {
  logs: string[];
  enabled?: boolean;
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
    // Fetch initial data
    fetchTriangles();
    fetchOpportunities();
    fetchTestOrderStatus();

    // WebSocket connection
    const socket: Socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
    });

    socket.on('triangle:opportunity', (data: TriangleOpportunity) => {
      setOpportunities(prev => [data, ...prev.slice(0, 49)]);
      fetchStats();
    });

    socket.on('triangle:added', () => fetchTriangles());
    socket.on('triangle:updated', () => fetchTriangles());
    socket.on('triangle:removed', () => fetchTriangles());
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
    socket.on('testorder:enabled', (data: { enabled: boolean }) => {
      setTestOrdersEnabled(data.enabled);
    });
    socket.on('testorder:log', (data: TestOrderLog) => {
      setTestOrderLogs(data.logs || []);
    });
    socket.on('testorder:logs-cleared', () => {
      setTestOrderLogs([]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Triangle className="text-purple-400" />
            Triangular Arbitrage
          </h2>
          <p className="text-gray-400">Monitor and manage triangular arbitrage opportunities</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
        >
          <Plus size={20} />
          Add Triangle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Triangles</p>
          <p className="text-2xl font-bold text-white">{stats.totalTriangles}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Enabled</p>
          <p className="text-2xl font-bold text-green-400">{stats.enabledTriangles}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Opportunities</p>
          <p className="text-2xl font-bold text-white">{stats.totalOpportunities}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Avg Profit</p>
          <p className="text-2xl font-bold text-blue-400">{stats.avgProfit.toFixed(3)}%</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Best Profit</p>
          <p className="text-2xl font-bold text-green-400">{stats.bestProfit.toFixed(3)}%</p>
        </div>
      </div>

      {/* Test Orders Control */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className={testOrdersEnabled ? 'text-yellow-400' : 'text-gray-400'} />
            <div>
              <h3 className="text-white font-medium">Test Orders</h3>
              <p className="text-gray-400 text-sm">
                {testOrdersEnabled ? '🧪 Simulating orders automatically' : 'Paused - no simulation'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTestOrders}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              testOrdersEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {testOrdersEnabled ? <Pause size={20} /> : <Play size={20} />}
            {testOrdersEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Test Order Logs */}
        {testOrderLogs.length > 0 && (
          <div className="bg-gray-900/50 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-gray-400 text-sm mb-2">Recent Test Orders:</p>
            {testOrderLogs.slice(0, 5).map((log, i) => (
              <div key={i} className="text-xs text-gray-300 font-mono mb-1">
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
          className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg border border-green-500/30"
        >
          Enable All
        </button>
        <button
          onClick={disableAll}
          className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg border border-red-500/30"
        >
          Disable All
        </button>
      </div>

      {/* Triangles List */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Monitored Triangles</h3>
        
        {triangles.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No triangles configured</p>
        ) : (
          <div className="space-y-2">
            {triangles.map((triangle) => (
              <div
                key={triangle.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  triangle.enabled
                    ? 'bg-gray-700/30 border-gray-600/50'
                    : 'bg-gray-800/50 border-gray-700/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleTriangle(triangle.id)}>
                    {triangle.enabled ? (
                      <Play className="text-green-400" size={20} />
                    ) : (
                      <Pause className="text-gray-400" size={20} />
                    )}
                  </button>
                  <div>
                    <p className="text-white font-medium">
                      {triangle.symbolA} → {triangle.symbolB} → {triangle.symbolC} → {triangle.symbolA}
                    </p>
                    <p className="text-gray-400 text-sm capitalize">
                      {triangle.exchange} | Min: {triangle.minProfitPercent}% | 
                      {triangle.testMode ? ' 🧪 Test' : ' 💰 Real'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTriangle(triangle.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Opportunities */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-green-400" />
            Best Opportunities
          </h3>
          <button
            onClick={fetchOpportunities}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Refresh
          </button>
        </div>

        {opportunities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No opportunities detected yet</p>
        ) : (
          <div className="space-y-2">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{opp.path}</p>
                    <p className="text-gray-400 text-sm capitalize">{opp.exchange}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${opp.profitPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {opp.profitPercent > 0 ? '+' : ''}{opp.profitPercent.toFixed(3)}%
                    </p>
                    <p className="text-gray-400 text-xs">
                      {opp.simulated ? '🧪 SIMULATED' : '💰 REAL'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Triangle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New Triangle</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Symbol A</label>
                  <input
                    type="text"
                    value={newTriangle.symbolA}
                    onChange={(e) => setNewTriangle({ ...newTriangle, symbolA: e.target.value.toUpperCase() })}
                    placeholder="BTC"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Symbol B</label>
                  <input
                    type="text"
                    value={newTriangle.symbolB}
                    onChange={(e) => setNewTriangle({ ...newTriangle, symbolB: e.target.value.toUpperCase() })}
                    placeholder="ETH"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Symbol C</label>
                  <input
                    type="text"
                    value={newTriangle.symbolC}
                    onChange={(e) => setNewTriangle({ ...newTriangle, symbolC: e.target.value.toUpperCase() })}
                    placeholder="USDT"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Exchange</label>
                <select
                  value={newTriangle.exchange}
                  onChange={(e) => setNewTriangle({ ...newTriangle, exchange: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="binance">Binance</option>
                  <option value="bybit">Bybit</option>
                  <option value="coinbase">Coinbase</option>
                  <option value="kraken">Kraken</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Min Profit: {newTriangle.minProfitPercent}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={newTriangle.minProfitPercent}
                  onChange={(e) => setNewTriangle({ ...newTriangle, minProfitPercent: parseFloat(e.target.value) })}
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
                <label htmlFor="testMode" className="text-gray-300">🧪 Test Mode (simulated orders)</label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addTriangle}
                disabled={!newTriangle.symbolA || !newTriangle.symbolB || !newTriangle.symbolC}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50"
              >
                Add Triangle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
