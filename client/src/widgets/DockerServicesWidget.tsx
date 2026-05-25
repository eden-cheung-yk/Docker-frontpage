import React, { useState, useEffect, useCallback } from 'react';
import { Server, ExternalLink, Search } from 'lucide-react';
import type { WidgetProps, DockerContainer } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

const STATUS_COLORS: Record<string, string> = {
  running: '#22c55e', stopped: '#ef4444', paused: '#8b8b8b',
  restarting: '#f59e0b', dead: '#ef4444', unhealthy: '#f59e0b',
};

export default function DockerServicesWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<DockerContainer[]>('/api/docker/containers');
      setContainers(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const interval = ((settings.refreshInterval as number) || 30) * 1000;
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, settings.refreshInterval]);

  const filtered = containers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.group?.toLowerCase().includes(filter.toLowerCase())
  );

  const groups = new Map<string, DockerContainer[]>();
  filtered.forEach(c => {
    const g = c.group || t('dockerWidget.services');
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(c);
  });

  const cardSize = (settings.cardSize as string) || 'normal';
  const padding = cardSize === 'compact' ? 10 : cardSize === 'large' ? 18 : 14;

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 'var(--border-radius)',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
      }}>
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          placeholder={t('dockerWidget.filterPlaceholder')}
          value={filter} onChange={e => setFilter(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>
            {containers.length === 0 ? t('dockerWidget.noContainers') : t('dockerWidget.noMatches')}
          </div>
        ) : (
          Array.from(groups.entries()).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8,
                fontFamily: 'var(--font-heading)',
              }}>
                {group}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {items.map((c, idx) => {
                  const statusColor = c.health === 'unhealthy' ? STATUS_COLORS.unhealthy : STATUS_COLORS[c.status] || '#8b8b8b';
                  return (
                    <a
                      key={c.id}
                      href={c.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding, borderRadius: 'var(--border-radius)',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                        animation: `fadeIn 0.3s ease-out ${idx * 30}ms both`,
                        textDecoration: 'none', color: 'inherit',
                        cursor: c.url ? 'pointer' : 'default',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${statusColor}15`, color: statusColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Server size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: cardSize === 'compact' ? 12 : 13, fontWeight: 600,
                          fontFamily: 'var(--font-heading)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <span className={`status-dot status-dot--${c.health === 'unhealthy' ? 'unhealthy' : c.status}`} />
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {c.health === 'unhealthy' ? 'unhealthy' : c.status}
                          </span>
                        </div>
                      </div>
                      {c.url && <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </a>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
