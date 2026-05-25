import React, { useEffect, useState, useCallback } from 'react';
import { Gauge, Download, Upload, Clock, Play, Loader } from 'lucide-react';
import type { WidgetProps, SpeedTestResult } from '../types';
import { apiGet, apiPost } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

export default function SpeedTestWidget(_props: WidgetProps) {
  const { t } = useDashboard();
  const [results, setResults] = useState<SpeedTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      const data = await apiGet<SpeedTestResult[]>('/api/speedtest/results');
      setResults(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const runTest = async () => {
    setRunning(true);
    try {
      await apiPost('/api/speedtest/run');
      await fetchResults();
    } catch { /* silent */ }
    finally { setRunning(false); }
  };

  const latest = results[0];
  const history = results.slice(0, 8);
  const maxDown = Math.max(...history.map(r => r.download), 1);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 14 }}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div className="skeleton" style={{ height: 48 }} />
          <div className="skeleton" style={{ height: 24, width: '60%' }} />
          <div className="skeleton" style={{ height: 48 }} />
        </div>
      ) : (
        <>
          {latest ? (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
              animation: 'fadeIn 0.4s ease-out both',
            }}>
              {[
                { icon: Download, label: t('speedWidget.download'), value: `${latest.download.toFixed(1)}`, unit: 'Mbps', color: 'var(--accent-primary)' },
                { icon: Upload, label: t('speedWidget.upload'), value: `${latest.upload.toFixed(1)}`, unit: 'Mbps', color: 'var(--accent-secondary)' },
                { icon: Clock, label: t('speedWidget.ping'), value: `${latest.ping.toFixed(0)}`, unit: 'ms', color: 'var(--accent-highlight)' },
              ].map(({ icon: Icon, label, value, unit, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <Icon size={16} style={{ color, marginBottom: 4 }} />
                  <div style={{
                    fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)',
                    color, lineHeight: 1.2,
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {unit}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
              {t('speedWidget.noResults')}
            </div>
          )}

          {history.length > 1 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, minHeight: 40 }}>
              {history.map((r, i) => (
                <div key={r.id} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max((r.download / maxDown) * 40, 4)}px`,
                    background: 'var(--accent-primary)',
                    borderRadius: 2, opacity: 1 - (i * 0.08),
                    transition: 'height 0.3s ease',
                  }} />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={runTest}
            disabled={running}
            style={{
              padding: '10px 16px', borderRadius: 'var(--border-radius)',
              background: running ? 'var(--bg-secondary)' : 'var(--accent-primary)',
              color: running ? 'var(--text-muted)' : 'var(--bg-primary)',
              fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all var(--transition-fast)',
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            {running ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('speedWidget.running')}</>
            ) : (
              <><Play size={14} /> {t('speedWidget.run')}</>
            )}
          </button>

          {latest && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              Last tested: {new Date(latest.timestamp).toLocaleString()}
            </div>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
