import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { apiGet } from '../hooks/useApi';
import type { DockerContainer, UptimeStatus } from '../types';

function stateColor(state: string): string {
  if (state === 'running') return '#22c55e';
  if (state === 'paused') return '#8b8b8b';
  if (state === 'restarting') return '#f59e0b';
  if (state === 'manual') return '#3b82f6';
  return '#ef4444';
}

function isRunning(state: string): boolean {
  return state === 'running';
}

function getGreetingKey(hour: number): string {
  if (hour < 12) return 'smartHeader.greetingMorning';
  if (hour < 18) return 'smartHeader.greetingAfternoon';
  return 'smartHeader.greetingEvening';
}

function Pill({ color, label, count }: { color: string; label: string; count: number }) {
  if (count === 0) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20,
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600,
      color: 'var(--text-secondary)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        boxShadow: `0 0 6px ${color}`,
      }} />
      {count} {label}
    </span>
  );
}

export default function SmartHeader() {
  const { settings, t } = useDashboard();
  const [time, setTime] = useState(new Date());
  const [services, setServices] = useState<DockerContainer[]>([]);
  const [uptimeStatuses, setUptimeStatuses] = useState<UptimeStatus[]>([]);
  const [dockerError, setDockerError] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<DockerContainer[]>('/api/docker/containers');
      setServices(data);
      setDockerError(false);
    } catch {
      setDockerError(true);
    }
    try {
      const uptime = await apiGet<UptimeStatus[]>('/api/uptime/status');
      setUptimeStatuses(uptime);
    } catch { /* optional */ }
  }, []);

  useEffect(() => {
    refresh();
    const interval = (settings.dockerScanInterval || 30) * 1000;
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, settings.dockerScanInterval]);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!searchContainerRef.current?.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const health = useMemo(() => {
    const docker = services.filter(s => !s.isManual);
    const manual = services.filter(s => s.isManual);
    return {
      running: docker.filter(s => isRunning(s.state)).length,
      stopped: docker.filter(s => !isRunning(s.state)).length,
      manual: manual.length,
      down: uptimeStatuses.filter(s => !s.isUp).length,
    };
  }, [services, uptimeStatuses]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return services
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.group?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.url?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [services, query]);

  if (!settings.showSmartHeader) return null;

  const greetingKey = getGreetingKey(time.getHours());
  const greeting = settings.displayName
    ? `${t(greetingKey)}, ${settings.displayName}`
    : t(greetingKey);

  const dateStr = time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const wrapper: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    animation: 'fadeIn 0.4s ease-out both',
  };

  const openService = (url: string | null) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    setQuery('');
    setSearchOpen(false);
  };

  return (
    <div style={wrapper}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, marginBottom: settings.showHealthPills || settings.showSearch ? 12 : 0,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18,
            color: 'var(--text-primary)',
          }}>
            {greeting}
          </div>
          <div style={{
            fontSize: 13, color: 'var(--text-muted)', marginTop: 2,
            fontFamily: 'var(--font-mono)',
          }}>
            {dateStr} · {timeStr}
          </div>
        </div>

        {services.length === 0 && !dockerError && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {t('smartHeader.emptyHint')}
          </span>
        )}
      </div>

      {(settings.showHealthPills || settings.showSearch) && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
        }}>
          {settings.showHealthPills && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
              {dockerError ? (
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  padding: '4px 12px', borderRadius: 20,
                  border: '1px solid var(--border-color)',
                }}>
                  {t('smartHeader.dockerUnavailable')}
                </span>
              ) : (
                <>
                  <Pill color="#22c55e" label={t('smartHeader.running')} count={health.running} />
                  <Pill color="#ef4444" label={t('smartHeader.stopped')} count={health.stopped} />
                  <Pill color="#3b82f6" label={t('smartHeader.manual')} count={health.manual} />
                  {health.down > 0 && (
                    <Pill color="#ef4444" label={t('smartHeader.down')} count={health.down} />
                  )}
                </>
              )}
            </div>
          )}

          {settings.showSearch && (
            <div ref={searchContainerRef} style={{ position: 'relative', minWidth: 220, flex: '1 1 280px', maxWidth: 400 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 'var(--border-radius)',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                transition: 'border-color var(--transition-fast)',
                borderColor: searchOpen ? 'var(--accent-primary)' : 'var(--border-color)',
              }}>
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t('smartHeader.searchPlaceholder')}
                  style={{ flex: 1, fontSize: 13, background: 'transparent' }}
                />
                <kbd style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                }}>
                  {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                </kbd>
              </div>

              {searchOpen && query.trim() && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-lg)',
                    zIndex: 50, overflow: 'hidden',
                    animation: 'fadeIn 0.15s ease-out both',
                  }}
                >
                  {results.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {t('smartHeader.noResults')}
                    </div>
                  ) : (
                    results.map(s => (
                      <button
                        key={s.id}
                        onClick={() => openService(s.url)}
                        disabled={!s.url}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', textAlign: 'left',
                          borderBottom: '1px solid var(--border-color)',
                          opacity: s.url ? 1 : 0.5,
                          transition: 'background var(--transition-fast)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: stateColor(s.state),
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
                            {s.name}
                          </div>
                          {s.group && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.group}</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
