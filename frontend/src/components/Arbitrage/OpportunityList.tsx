import { useStore } from '../../store/useStore';
import { ArrowRightLeft, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function OpportunityList() {
  const { opportunities } = useStore();

  if (opportunities.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🚀 Oportunidades de Arbitragem</h2>
        <div className="text-center py-12">
          <TrendingUp className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 text-lg">Nenhuma oportunidade detectada ainda</p>
          <p className="text-gray-500 text-sm mt-2">
            As oportunidades aparecerão aqui quando o spread entre exchanges for maior que 0.5%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          🚀 Oportunidades de Arbitragem
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({opportunities.length})
          </span>
        </h2>
        <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
          <ExternalLink size={16} />
          Exportar
        </button>
      </div>

      <div className="space-y-3">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{opp.symbol}</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                  {opp.type === 'cross-exchange' ? 'Cross-Exchange' : 'Triangular'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Clock size={14} />
                {formatDistanceToNow(opp.timestamp, { addSuffix: true })}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              {/* Buy Side */}
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Comprar em</p>
                <p className="text-green-400 font-medium capitalize">
                  {opp.buyExchange}
                </p>
                <p className="text-white font-bold">
                  ${opp.buyPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRightLeft className="text-gray-500" size={24} />

              {/* Sell Side */}
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-400 mb-1">Vender em</p>
                <p className="text-red-400 font-medium capitalize">
                  {opp.sellExchange}
                </p>
                <p className="text-white font-bold">
                  ${opp.sellPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
              <div>
                <span className="text-gray-400 text-sm">Profit: </span>
                <span className="text-green-400 font-bold text-lg">
                  {opp.profitPercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-sm">Volume: </span>
                <span className="text-white font-medium">
                  ${opp.volume.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
