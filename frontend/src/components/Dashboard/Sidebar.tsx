import { LayoutDashboard, DollarSign, TrendingUp, Triangle, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'prices' | 'arbitrage' | 'triangular';
  onTabChange: (tab: 'dashboard' | 'prices' | 'arbitrage' | 'triangular') => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'prices', label: 'Preços', icon: DollarSign },
  { id: 'arbitrage', label: 'Cross-Exchange', icon: TrendingUp },
  { id: 'triangular', label: 'Triangular', icon: Triangle },
] as const;

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900/50 border-r border-gray-700/50 p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white px-4">📊 Arbitrage</h2>
      </div>

      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Activity size={12} />
            Exchanges Ativas
          </p>
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-green-400">Binance</span>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-green-400">Bybit</span>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-green-400">Coinbase</span>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-green-400">Kraken</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
