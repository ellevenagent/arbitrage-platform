import { useStore } from '../../store/useStore';
import { useEffect, useState } from 'react';

export function PriceTicker() {
  const { prices } = useStore();
  const [tickerPrices, setTickerPrices] = useState<any[]>([]);

  useEffect(() => {
    const allPrices: any[] = [];
    prices.forEach((symbolPrices) => {
      symbolPrices.forEach((p) => {
        allPrices.push(p);
      });
    });

    // Get unique symbols with best price
    const symbols = [...new Set(allPrices.map((p) => p.symbol))];
    const bestPrices = symbols.slice(0, 8).map((symbol) => {
      const symbolData = allPrices.filter((p) => p.symbol === symbol);
      const best = symbolData.reduce((min, p) => p.price < min.price ? p : min);
      return best;
    });

    setTickerPrices(bestPrices);
  }, [prices]);

  if (tickerPrices.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <p className="text-gray-400 text-center">Aguardando preços das exchanges...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {tickerPrices.map((price) => (
        <div
          key={price.symbol}
          className="flex-shrink-0 bg-gray-800/50 border border-gray-700/50 rounded-xl px-6 py-4 min-w-[180px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-white">
              {price.symbol.split('/')[0]}
            </span>
            <span className="text-sm text-gray-400">/USDT</span>
          </div>
          <p className="text-xl font-bold text-white">
            ${price.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </p>
          <p
            className={`text-sm mt-1 flex items-center gap-1 ${
              price.change24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {price.change24h >= 0 ? '▲' : '▼'}
            {Math.abs(price.change24h).toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
