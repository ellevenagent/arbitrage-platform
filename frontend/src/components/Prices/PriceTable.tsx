import { useStore } from '../../store/useStore';
import { useEffect, useState } from 'react';

interface PriceRowProps {
  symbol: string;
  prices: any[];
}

function PriceRow({ symbol, prices }: PriceRowProps) {
  if (prices.length === 0) return null;

  const sortedByPrice = [...prices].sort((a, b) => a.price - b.price);
  const cheapest = sortedByPrice[0];
  const expensive = sortedByPrice[sortedByPrice.length - 1];
  const spread = ((expensive.price - cheapest.price) / cheapest.price) * 100;

  return (
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl font-bold text-white">{symbol}</span>
        <span className={`text-sm ${spread > 0.5 ? 'text-green-400' : 'text-gray-400'}`}>
          Spread: {spread.toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sortedByPrice.map((price) => (
          <div
            key={price.exchange}
            className={`p-2 rounded ${
              price.price === cheapest.price
                ? 'bg-green-500/20 border border-green-500/30'
                : price.price === expensive.price
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-gray-700/30'
            }`}
          >
            <p className="text-xs text-gray-400 capitalize">{price.exchange}</p>
            <p className="font-medium text-white">
              ${price.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            </p>
            <p
              className={`text-xs ${
                price.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {price.change24h >= 0 ? '+' : ''}
              {price.change24h.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PriceTable() {
  const { prices } = useStore();
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    const allSymbols = [...prices.keys()];
    setSymbols(allSymbols.slice(0, 10)); // Show top 10
  }, [prices]);

  if (symbols.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">📊 Preços por Exchange</h2>
        <p className="text-gray-400 text-center">Aguardando preços das exchanges...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">📊 Preços por Exchange</h2>
      
      {symbols.map((symbol) => (
        <PriceRow
          key={symbol}
          symbol={symbol}
          prices={prices.get(symbol) || []}
        />
      ))}
    </div>
  );
}
