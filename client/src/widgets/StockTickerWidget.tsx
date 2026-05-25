import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Settings } from 'lucide-react';
import type { WidgetProps } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function StockTickerWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  const symbols = (settings.symbols as string[]) || [];
  const apiKey = settings.apiKey as string;

  const fetch_ = useCallback(async () => {
    if (symbols.length === 0) { setLoading(false); return; }
    try {
      const data = await apiGet<StockQuote[]>(
        `/api/widgets/stocks?symbols=${encodeURIComponent(symbols.join(','))}`
      );
      setQuotes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [symbols.join(',')]);

  useEffect(() => {
    fetch_();
    const interval = ((settings.refreshInterval as number) || 300) * 1000;
    const id = setInterval(fetch_, interval);
    return () => clearInterval(id);
  }, [fetch_, settings.refreshInterval]);

  if (symbols.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: 24, color: 'var(--text-muted)', textAlign: 'center',
      }}>
        <Settings size={28} style={{ opacity: 0.4 }} />
        <span style={{ fontSize: 13 }}>{t('stockWidget.configureSymbols')}</span>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {quotes.map((q, idx) => {
            const isPositive = q.change >= 0;
            const changeColor = isPositive ? '#22c55e' : '#ef4444';
            return (
              <div
                key={q.symbol}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 'var(--border-radius)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  animation: `fadeIn 0.3s ease-out ${idx * 50}ms both`,
                }}
              >
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    fontFamily: 'var(--font-heading)', letterSpacing: '0.03em',
                  }}>
                    {q.symbol}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {q.name || q.symbol}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    ${q.price.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: 12, color: changeColor, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end',
                  }}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositive ? '+' : ''}{q.change.toFixed(2)} ({q.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
