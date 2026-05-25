import React, { useState } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import TopBar from './components/TopBar';
import WidgetGrid from './components/WidgetGrid';
import WidgetGallery from './components/WidgetGallery';
import SettingsPanel from './components/SettingsPanel';

function DashboardShell() {
  const { isEditMode, isLoading, t } = useDashboard();
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  React.useEffect(() => {
    if (isEditMode && !showGallery) setShowGallery(true);
    if (!isEditMode) setShowGallery(false);
  }, [isEditMode]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', fontSize: 14 }}>
          {t('loading.dashboard')}
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar onOpenSettings={() => setShowSettings(true)} />
      <main style={{ padding: '8px 0' }}>
        <WidgetGrid />
      </main>
      {showGallery && isEditMode && (
        <WidgetGallery onClose={() => setShowGallery(false)} />
      )}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}
