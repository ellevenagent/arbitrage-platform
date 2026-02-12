import { Wifi, WifiOff, Activity, Zap } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function Header() {
  const { isConnected, opportunities } = useStore();

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            🚀 Arbitrage Platform
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time crypto arbitrage detection
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isConnected 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
            <span className="font-medium">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Active Opportunities */}
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg">
            <Zap size={20} />
            <span className="font-medium">
              {opportunities.length} oportunidades
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
