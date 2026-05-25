import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Plus, Trash2, Check, X as XIcon, Globe } from 'lucide-react';
import type { WidgetProps, UptimeStatus } from '../types';
import { apiGet, apiPost, apiDelete } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

export default function UptimeMonitorWidget({ isEditMode }: WidgetProps) {
  const { t } = useDashboard();
  const [statuses, setStatuses] = useState<UptimeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', url: '' });

  const fetch_ = useCallback(async () => {
    try {
      const data = await apiGet<UptimeStatus[]>('/api/uptime/status');
      setStatuses(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, [fetch_]);

  const addTarget = async () => {
    if (!form.name || !form.url) return;
    try {
      await apiPost('/api/uptime/targets', form);
      setForm({ name: '', url: '' });
      setShowAdd(false);
      fetch_();
    } catch { /* silent */ }
  };

  const removeTarget = async (targetId: string) => {
    try {
      await apiDelete(`/api/uptime/targets/${targetId}`);
      setStatuses(prev => prev.filter(s => s.targetId !== targetId));
    } catch { /* silent */ }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 12px', borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 13,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Uptime Monitor</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          width: 26, height: 26, borderRadius: 6, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)',
        }}>
          <Plus size={14} />
        </button>
      </div>

      {showAdd && (
        <div style={{
          padding: 12, borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)', display: 'flex', gap: 6,
          animation: 'slideInDown 0.2s ease-out both',
        }}>
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inputStyle} placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <button onClick={addTarget} style={{
            width: 32, height: 32, borderRadius: 6, flexShrink: 0,
            background: 'var(--accent-primary)', color: 'var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={14} />
          </button>
          <button onClick={() => setShowAdd(false)} style={{
            width: 32, height: 32, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <XIcon size={14} />
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : statuses.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {t('uptimeWidget.noTargets')}
          </div>
        ) : (
          statuses.map((s, idx) => (
            <div
              key={s.targetId}
              style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: 12,
                animation: `fadeIn 0.3s ease-out ${idx * 40}ms both`,
              }}
            >
              <span className={`status-dot status-dot--${s.isUp ? 'running' : 'stopped'}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-heading)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {s.name}
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: s.isUp ? '#22c55e22' : '#ef444422',
                    color: s.isUp ? '#22c55e' : '#ef4444',
                    fontWeight: 700,
                  }}>
                    {s.isUp ? 'UP' : 'DOWN'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  <span>{s.responseTime}ms</span>
                  <span>{s.uptimePercentage.toFixed(1)}% uptime</span>
                </div>
              </div>
              {isEditMode && (
                <button onClick={() => removeTarget(s.targetId)} style={{
                  width: 24, height: 24, borderRadius: 4, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
