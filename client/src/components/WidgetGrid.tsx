import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useDashboard } from '../context/DashboardContext';
import WidgetWrapper from './WidgetWrapper';
import { getWidgetDefinition } from '../widgets/registry';
import type { LayoutItem } from '../types';

const ResponsiveGrid = WidthProvider(Responsive);

export default function WidgetGrid() {
  const { layout, updateLayout, isEditMode, widgetInstances, setWidgetInstances, t } = useDashboard();

  const enrichedLayout = useMemo(() => layout.map(item => {
    const inst = widgetInstances[item.i];
    const widgetType = inst?.widgetType ?? item.i.split('-').slice(0, -1).join('-');
    const def = getWidgetDefinition(widgetType);
    return {
      ...item,
      minW: item.minW ?? def?.minSize.w ?? 2,
      minH: item.minH ?? def?.minSize.h ?? 1,
      maxW: item.maxW ?? def?.maxSize.w ?? 12,
      maxH: item.maxH ?? def?.maxSize.h ?? 8,
    };
  }), [layout, widgetInstances]);

  const layouts = useMemo(() => ({
    lg: enrichedLayout,
    md: enrichedLayout.map(l => ({ ...l, w: Math.min(l.w, 6) })),
    sm: enrichedLayout.map(l => ({ ...l, x: 0, w: 2 })),
  }), [enrichedLayout]);

  const handleLayoutChange = useCallback((_current: LayoutItem[], allLayouts: Record<string, LayoutItem[]>) => {
    if (!allLayouts.lg) return;
    const updated = allLayouts.lg.map(rglItem => {
      const existing = layout.find(l => l.i === rglItem.i);
      if (!existing) return rglItem;
      return {
        ...existing,
        x: rglItem.x, y: rglItem.y, w: rglItem.w, h: rglItem.h,
      };
    });
    updateLayout(updated);
  }, [updateLayout, layout]);

  const handleRemove = useCallback((instanceId: string) => {
    updateLayout(layout.filter(l => l.i !== instanceId));
    setWidgetInstances(prev => {
      const next = { ...prev };
      delete next[instanceId];
      return next;
    });
  }, [layout, updateLayout, setWidgetInstances]);

  if (layout.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', color: 'var(--text-muted)', gap: 12,
        animation: 'fadeIn 0.6s ease-out both',
      }}>
        <span style={{ fontSize: 48, opacity: 0.3 }}>⬡</span>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{t('grid.noWidgets')}</p>
        <p style={{ fontSize: 14 }}>{t('grid.addPrompt')}</p>
      </div>
    );
  }

  return (
    <ResponsiveGrid
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 768, sm: 0 }}
      cols={{ lg: 12, md: 6, sm: 2 }}
      rowHeight={120}
      containerPadding={[24, 24]}
      margin={[16, 16]}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
      useCSSTransforms
    >
      {enrichedLayout.map(item => {
        const inst = widgetInstances[item.i];
        const widgetType = inst?.widgetType ?? item.i.split('-').slice(0, -1).join('-') ?? item.i;
        return (
          <div key={item.i} data-grid={item}>
            <WidgetWrapper
              instanceId={item.i}
              widgetType={widgetType}
              onRemove={handleRemove}
            />
          </div>
        );
      })}
    </ResponsiveGrid>
  );
}
