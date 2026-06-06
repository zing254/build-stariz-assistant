import { useState, useEffect, memo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { fetchWithFallback } from '../../../utils/helpers';

const CRYPTO_FALLBACK = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 67234.50, price_change_percentage_24h: 2.34, image: '' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 3456.78, price_change_percentage_24h: -1.12, image: '' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 178.92, price_change_percentage_24h: 5.67, image: '' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', current_price: 0.58, price_change_percentage_24h: -0.45, image: '' },
];

export const CryptoWidget = memo(function CryptoWidget() {
  const [coins, setCoins] = useState(CRYPTO_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCoins = async () => {
    setLoading(true);
    setError('');
    const data = await fetchWithFallback(
      async () => {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,polkadot,chainlink&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h');
        if (!res.ok) throw new Error('Failed');
        return res.json();
      },
      null
    );
    if (data && data.length > 0) {
      setCoins(data);
    } else {
      setCoins(CRYPTO_FALLBACK);
      setError('Using cached prices');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#ffcc00]" />
          <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Crypto Live</span>
        </div>
        <button onClick={fetchCoins} className="text-white/30 hover:text-[#ffcc00] transition-colors" aria-label="Refresh crypto prices">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-[#ffcc00]/5 border border-[#ffcc00]/20">
          <AlertCircle className="w-3 h-3 text-[#ffcc00]/60" />
          <span className="text-[9px] font-mono text-[#ffcc00]/60">{error}</span>
        </div>
      )}

      {loading && coins.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-[#ffcc00]/50 animate-spin" />
            <span className="text-[10px] font-mono text-white/40">Loading prices...</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {coins.map((coin) => (
            <div key={coin.id} className="flex items-center justify-between p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ffcc00]/10 flex items-center justify-center text-[10px] font-bold text-[#ffcc00]">
                  {coin.symbol}
                </div>
                <div>
                  <div className="text-xs font-mono font-semibold text-white/80">{coin.name}</div>
                  <div className="text-[10px] font-mono text-white/30">{coin.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">${coin.current_price.toLocaleString()}</div>
                <div className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${coin.price_change_percentage_24h >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                  {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
