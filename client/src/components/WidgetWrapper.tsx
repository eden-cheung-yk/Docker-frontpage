import React, { useState, Suspense } from 'react';
import { GripVertical, Settings, X, AlertTriangle } from 'lucide-react';
import { getWidgetComponent, getWidgetDefinition } from '../widgets/registry';
import { useDashboard } from '../context/DashboardContext';
import SettingsForm from './SettingsForm';
import type { WidgetInstance } from '../types';

interface WidgetWrapperProps {
  instanceId: string;
  widgetType: string;
  onRemove: (id: string) => void;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

function Skeleton() {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 16, width: '60%' }} />
      <div className="skeleton" style={{ height: 12, width: '80%' }} />
      <div className="skeleton" style={{ height: 12, width: '45%' }} />
      <div className="skeleton" style={{ height: 40, width: '100%', marginTop: 8 }} />
    </div>
  );
}

export default function WidgetWrapper({ instanceId, widgetType, onRemove }: WidgetWrapperProps) {
  const { isEditMode, widgetInstances, setWidgetInstances, t } = useDashboard();
  const [showSettings, setShowSettings] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [hovered, setHovered] = useState(false);

  const Component = getWidgetComponent(widgetType);
  const definition = getWidgetDefinition(widgetType);
  const instance = widgetInstances[instanceId];
  const widgetSettings = instance?.settings ?? {};

  const handleSettingsChange = (key: string, value: unknown) => {
    setWidgetInstances(prev => ({
      ...prev,
      [instanceId]: {
        ...prev[instanceId],
        settings: { ...prev[instanceId]?.settings, [key]: value },
      } as WidgetInstance,
    }));
  };

  const card: React.CSSProperties = {
    height: '100%',
    borderRadius: 'var(--border-radius-lg)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    boxShadow: hovered ? 'var(--card-glow-hover)' : 'var(--shadow-md)',
    borderColor: hovered ? 'var(--card-border-hover)' : 'var(--border-color)',
    overflow: 'hidden',
    transition: 'box-shadow var(--transition-normal), border-color var(--transition-normal)',
    display: 'flex', flexDirection: 'column',
    animation: 'fadeIn 0.4s ease-out both',
  };

  const dragHandle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 10px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'grab', userSelect: 'none',
    fontSize: 12, fontFamily: 'var(--font-heading)', fontWeight: 600,
    color: 'var(--text-secondary)',
  };

  const iconBtn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background var(--transition-fast)',
  };

  const errorFallback = (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--accent-secondary)' }}>
      <AlertTriangle size={28} />
      <span style={{ fontSize: 13 }}>{t('widget.failedToLoad')}</span>
    </div>
  );

  return (
    <div
      className="widget-card"
      style={card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isEditMode && (
        <div style={dragHandle}>
          <div className="drag-handle" style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, cursor: 'grab' }}>
            <GripVertical size={14} />
            <span>{definition?.name ?? widgetType}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            {definition && definition.settingsSchema.length > 0 && (
              <button
                style={{ ...iconBtn, background: showSettings ? 'var(--accent-primary)' : undefined, color: showSettings ? 'var(--bg-primary)' : undefined }}
                onClick={() => setShowSettings(!showSettings)}
                title={t('widget.settings')}
              >
                <Settings size={14} />
              </button>
            )}
            {!confirmRemove ? (
              <button style={{ ...iconBtn, color: 'var(--accent-secondary)' }} onClick={() => setConfirmRemove(true)} title={t('widget.remove')}>
                <X size={14} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
                <span>{t('widget.removeConfirm')}</span>
                <button style={{ ...iconBtn, color: 'var(--accent-secondary)', fontSize: 11, fontWeight: 700 }} onClick={() => onRemove(instanceId)}>{t('widget.yes')}</button>
                <button style={{ ...iconBtn, fontSize: 11 }} onClick={() => setConfirmRemove(false)}>{t('widget.no')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && isEditMode && definition && (
        <div style={{
          padding: 16, borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)', maxHeight: 300, overflowY: 'auto',
        }}>
          <SettingsForm
            schema={definition.settingsSchema}
            values={widgetSettings}
            onChange={handleSettingsChange}
          />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <ErrorBoundary fallback={errorFallback}>
          <Suspense fallback={<Skeleton />}>
            {Component ? (
              <Component instanceId={instanceId} settings={widgetSettings} isEditMode={isEditMode} />
            ) : (
              <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                {t('widget.unknown')} {widgetType}
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
