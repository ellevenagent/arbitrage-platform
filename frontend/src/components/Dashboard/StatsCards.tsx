import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  // Props would be passed from store in a real implementation
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Arbitrage Opportunities */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Oportunidades</span>
          <TrendingUp className="text-purple-400" size={20} />
        </div>
        <p className="text-3xl font-bold text-white">12</p>
        <p className="text-xs text-purple-400 mt-1">↑ 3 nas últimas 1h</p>
      </div>

      {/* Best Profit */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Melhor Profit</span>
          <Activity className="text-green-400" size={20} />
        </div>
        <p className="text-3xl font-bold text-white">2.45%</p>
        <p className="text-xs text-green-400 mt-1">BTC/ETH - Binance → Kraken</p>
      </div>

      {/* Volume 24h */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Volume 24h</span>
          <DollarSign className="text-blue-400" size={20} />
        </div>
        <p className="text-3xl font-bold text-white">$1.2M</p>
        <p className="text-xs text-blue-400 mt-1">Across all exchanges</p>
      </div>

      {/* Active Pairs */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">Pares Ativos</span>
          <TrendingUp className="text-orange-400" size={20} />
        </div>
        <p className="text-3xl font-bold text-white">10</p>
        <p className="text-xs text-orange-400 mt-1">BTC, ETH, SOL, BNB...</p>
      </div>
    </div>
  );
}
