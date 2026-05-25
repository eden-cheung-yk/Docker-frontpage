import React, { useState, useEffect } from 'react';
import { Pencil, Settings, PencilOff } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

interface TopBarProps {
  onOpenSettings: () => void;
}

export default function TopBar({ onOpenSettings }: TopBarProps) {
  const { settings, isEditMode, toggleEditMode, t } = useDashboard();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const bar: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 100,
    height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px',
    background: 'var(--topbar-bg)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-color)',
  };

  const editStrip: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
    opacity: isEditMode ? 1 : 0,
    transition: 'opacity var(--transition-fast)',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '20px',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const iconBtn = (active?: boolean): React.CSSProperties => ({
    width: 38, height: 38, borderRadius: 'var(--border-radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'var(--accent-primary)' : 'transparent',
    color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
    boxShadow: active ? '0 0 14px var(--accent-primary)' : 'none',
  });

  const clockStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: '14px',
    color: 'var(--text-secondary)', letterSpacing: '0.5px',
  };

  return (
    <header style={bar}>
      <div style={editStrip} />
      <h1 style={titleStyle}>{settings.title || 'DockerDash'}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={clockStyle}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button onClick={toggleEditMode} style={iconBtn(isEditMode)} title={isEditMode ? t('topbar.exitEdit') : t('topbar.editLayout')}>
          {isEditMode ? <PencilOff size={18} /> : <Pencil size={18} />}
        </button>
        <button onClick={onOpenSettings} style={iconBtn()} title={t('topbar.settings')}>
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
