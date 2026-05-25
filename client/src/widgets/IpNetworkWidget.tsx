import React, { useEffect, useState, useCallback } from 'react';
import { Globe, Copy, Check, RefreshCw } from 'lucide-react';
import type { WidgetProps, NetworkInfo } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

export default function IpNetworkWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [info, setInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const showInternal = settings.showInternal !== false;
  const showExternal = settings.showExternal !== false;

  const fetch_ = useCallback(async () => {
    try {
      const data = await apiGet<NetworkInfo>('/api/network/info');
      setInfo(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const interval = ((settings.checkInterval as number) || 300) * 1000;
    const id = setInterval(fetch_, interval);
    return () => clearInterval(id);
  }, [fetch_, settings.checkInterval]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* silent */ }
  };

  if (loading || !info) {
    return (
      <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 36, flex: '1 1 40%' }} />)}
      </div>
    );
  }

  const fields: { key: string; label: string; value: string; show: boolean }[] = [
    { key: 'internal', label: t('ipWidget.internalIp'), value: info.internalIp, show: showInternal },
    { key: 'external', label: t('ipWidget.externalIp'), value: info.externalIp, show: showExternal },
    { key: 'hostname', label: t('ipWidget.hostname'), value: info.hostname, show: true },
    { key: 'gateway', label: 'Gateway', value: info.gateway, show: true },
  ];

  return (
    <div style={{
      height: '100%', padding: 16,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10, width: '100%',
      }}>
        {fields.filter(f => f.show).map((f, idx) => (
          <button
            key={f.key}
            onClick={() => copyToClipboard(f.value, f.key)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '10px 12px', borderRadius: 'var(--border-radius)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              textAlign: 'left', cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
              animation: `fadeIn 0.3s ease-out ${idx * 60}ms both`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
            title="Click to copy"
          >
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
              {f.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {f.value || '—'}
              </span>
              {copied === f.key ? (
                <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
              ) : (
                <Copy size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
