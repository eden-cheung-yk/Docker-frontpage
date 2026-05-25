import React, { useEffect, useState, useCallback } from 'react';
import { Cpu, HardDrive, MemoryStick } from 'lucide-react';
import type { WidgetProps } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

interface SystemStats {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
}

function getColor(pct: number): string {
  if (pct < 60) return '#22c55e';
  if (pct < 80) return '#f59e0b';
  return '#ef4444';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function ProgressRing({ percent, color, label, icon: Icon, detail }: {
  percent: number; color: string; label: string; icon: React.ElementType; detail: string;
}) {
  const r = 34;
  const stroke = 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      animation: 'fadeIn 0.5s ease-out both',
    }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
          <circle
            cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)',
            color,
          }}>
            {Math.round(percent)}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
          fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-heading)',
        }}>
          <Icon size={12} /> {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

export default function SystemMonitorWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const showCpu = settings.showCpu !== false;
  const showMemory = settings.showMemory !== false;
  const showDisk = settings.showDisk !== false;

  const fetch_ = useCallback(async () => {
    try {
      const data = await apiGet<SystemStats>('/api/widgets/system');
      setStats(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const interval = ((settings.refreshInterval as number) || 5) * 1000;
    const id = setInterval(fetch_, interval);
    return () => clearInterval(id);
  }, [fetch_, settings.refreshInterval]);

  if (loading || !stats) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: 20,
      }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />)}
      </div>
    );
  }

  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 16, flexWrap: 'wrap',
    }}>
      {showCpu && (
        <ProgressRing
          percent={stats.cpu}
          color={getColor(stats.cpu)}
          label={t('sysMonWidget.cpu')}
          icon={Cpu}
          detail={`${stats.cpu.toFixed(1)}%`}
        />
      )}
      {showMemory && (
        <ProgressRing
          percent={stats.memory.percent}
          color={getColor(stats.memory.percent)}
          label={t('sysMonWidget.memory')}
          icon={MemoryStick}
          detail={`${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`}
        />
      )}
      {showDisk && (
        <ProgressRing
          percent={stats.disk.percent}
          color={getColor(stats.disk.percent)}
          label={t('sysMonWidget.disk')}
          icon={HardDrive}
          detail={`${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}`}
        />
      )}
    </div>
  );
}
