import React from 'react';
import { X, Plus, Container, CloudSun, Rss, TrendingUp, CalendarDays, Bookmark, Cpu, ListChecks, StickyNote, Gauge, Activity, Globe } from 'lucide-react';
import { getAllWidgetDefinitions } from '../widgets/registry';
import { useDashboard } from '../context/DashboardContext';
import type { LayoutItem, WidgetInstance } from '../types';

const ICONS: Record<string, React.ElementType> = {
  Container, CloudSun, Rss, TrendingUp, CalendarDays, Bookmark,
  Cpu, ListChecks, StickyNote, Gauge, Activity, Globe,
};

interface WidgetGalleryProps {
  onClose: () => void;
}

export default function WidgetGallery({ onClose }: WidgetGalleryProps) {
  const { layout, updateLayout, setWidgetInstances, t } = useDashboard();
  const definitions = getAllWidgetDefinitions();

  const addWidget = (id: string) => {
    const def = definitions.find(d => d.id === id);
    if (!def) return;

    const instanceId = `${id}-${Date.now()}`;
    const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);

    const newItem: LayoutItem = {
      i: instanceId,
      x: 0, y: maxY,
      w: def.defaultSize.w, h: def.defaultSize.h,
      minW: def.minSize.w, minH: def.minSize.h,
      maxW: def.maxSize.w, maxH: def.maxSize.h,
    };

    const newInstance: WidgetInstance = {
      instanceId,
      widgetType: id,
      settings: {},
    };

    updateLayout([...layout, newItem]);
    setWidgetInstances(prev => ({ ...prev, [instanceId]: newInstance }));
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.5)',
    animation: 'fadeIn 0.2s ease-out both',
  };

  const panel: React.CSSProperties = {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 360, maxWidth: '90vw', zIndex: 201,
    background: 'var(--bg-secondary)',
    borderLeft: '1px solid var(--border-color)',
    display: 'flex', flexDirection: 'column',
    animation: 'slideInRight 0.3s ease-out both',
    boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
  };

  const header: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18,
  };

  return (
    <>
      <div style={overlay} onClick={onClose} />
      <aside style={panel}>
        <div style={header}>
          <span>{t('gallery.title')}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {definitions.map((def, idx) => {
            const Icon = ICONS[def.icon] ?? Globe;
            return (
              <div
                key={def.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 'var(--border-radius)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                  animation: `fadeIn 0.3s ease-out ${idx * 40}ms both`,
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--card-glow-hover)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-primary)', flexShrink: 0,
                }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{t('widgetName.' + def.id) || def.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('widgetDesc.' + def.id) || def.description}</div>
                </div>
                <button
                  onClick={() => addWidget(def.id)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'var(--accent-primary)', color: 'var(--bg-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  title={`Add ${t('widgetName.' + def.id) || def.name}`}
                >
                  <Plus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
