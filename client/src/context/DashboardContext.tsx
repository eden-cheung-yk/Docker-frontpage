import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { DashboardSettings, LayoutItem, WidgetInstance } from '../types';
import { apiGet, apiPut } from '../hooks/useApi';
import { createTranslator } from '../i18n';

interface DashboardContextValue {
  settings: DashboardSettings;
  updateSettings: (partial: Partial<DashboardSettings>) => Promise<void>;
  layout: LayoutItem[];
  updateLayout: (items: LayoutItem[]) => void;
  widgetInstances: Record<string, WidgetInstance>;
  setWidgetInstances: React.Dispatch<React.SetStateAction<Record<string, WidgetInstance>>>;
  isEditMode: boolean;
  toggleEditMode: () => void;
  theme: string;
  isLoading: boolean;
  t: (key: string) => string;
}

const defaultSettings: DashboardSettings = {
  title: 'DockerDash',
  theme: 'dark-neon',
  language: 'en',
  displayName: '',
  showSmartHeader: true,
  showHealthPills: true,
  showSearch: true,
  accentColor: '#00f0ff',
  backgroundType: 'solid',
  backgroundColor: '#0a0e1a',
  backgroundGradient: '',
  backgroundImage: '',
  fontSize: 'medium',
  dockerSocketPath: '/var/run/docker.sock',
  dockerScanInterval: 30,
  hostUrl: '',
  containerFilter: '',
};

function parseBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true';
}

function parseSettings(raw: Record<string, unknown>): DashboardSettings {
  return {
    title: String(raw.title ?? defaultSettings.title),
    theme: String(raw.theme ?? defaultSettings.theme),
    language: String(raw.language ?? defaultSettings.language),
    displayName: String(raw.displayName ?? defaultSettings.displayName),
    showSmartHeader: parseBool(raw.showSmartHeader, defaultSettings.showSmartHeader),
    showHealthPills: parseBool(raw.showHealthPills, defaultSettings.showHealthPills),
    showSearch: parseBool(raw.showSearch, defaultSettings.showSearch),
    accentColor: String(raw.accentColor ?? defaultSettings.accentColor),
    backgroundType: (raw.backgroundType as DashboardSettings['backgroundType']) ?? defaultSettings.backgroundType,
    backgroundColor: String(raw.backgroundColor ?? defaultSettings.backgroundColor),
    backgroundGradient: String(raw.backgroundGradient ?? defaultSettings.backgroundGradient),
    backgroundImage: String(raw.backgroundImage ?? defaultSettings.backgroundImage),
    fontSize: (raw.fontSize as DashboardSettings['fontSize']) ?? defaultSettings.fontSize,
    dockerSocketPath: String(raw.dockerSocketPath ?? defaultSettings.dockerSocketPath),
    dockerScanInterval: Number(raw.dockerScanInterval) || defaultSettings.dockerScanInterval,
    hostUrl: String(raw.hostUrl ?? defaultSettings.hostUrl),
    containerFilter: String(raw.containerFilter ?? defaultSettings.containerFilter),
  };
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [widgetInstances, setWidgetInstances] = useState<Record<string, WidgetInstance>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef(layout);

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        interface BackendLayoutItem {
          instanceId: string;
          widgetType: string;
          x: number; y: number; w: number; h: number;
          settings: Record<string, unknown>;
        }
        const [rawSettings, rawLayout] = await Promise.all([
          apiGet<Record<string, unknown>>('/api/settings').catch(() => ({})),
          apiGet<BackendLayoutItem[]>('/api/layout').catch(() => []),
        ]);
        if (cancelled) return;
        setSettings(parseSettings(rawSettings));

        const layoutItems: LayoutItem[] = rawLayout.map(item => ({
          i: item.instanceId,
          x: item.x, y: item.y, w: item.w, h: item.h,
        }));
        setLayout(layoutItems);

        const instances: Record<string, WidgetInstance> = {};
        for (const item of rawLayout) {
          instances[item.instanceId] = {
            instanceId: item.instanceId,
            widgetType: item.widgetType,
            settings: item.settings || {},
          };
        }
        setWidgetInstances(instances);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.fontSize = settings.fontSize;
    document.documentElement.lang = settings.language || 'en';
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.title = settings.title || 'DockerDash';
  }, [settings.theme, settings.fontSize, settings.title, settings.language]);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const updateSettings = useCallback(async (partial: Partial<DashboardSettings>) => {
    const next = { ...settingsRef.current, ...partial };
    setSettings(next);
    apiPut('/api/settings', next).catch(() => {});
  }, []);

  const updateLayout = useCallback((items: LayoutItem[]) => {
    setLayout(items);
    if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = setTimeout(() => {
      setWidgetInstances(currentInstances => {
        const backendItems = items.map(item => {
          const inst = currentInstances[item.i];
          return {
            instanceId: item.i,
            widgetType: inst?.widgetType ?? item.i.split('-').slice(0, -1).join('-'),
            x: item.x, y: item.y, w: item.w, h: item.h,
            settings: inst?.settings || {},
          };
        });
        apiPut('/api/layout', backendItems).catch(() => {});
        return currentInstances;
      });
    }, 500);
  }, []);

  const toggleEditMode = useCallback(() => setIsEditMode(v => !v), []);

  const t = useMemo(() => createTranslator(settings.language || 'en'), [settings.language]);

  const contextValue = useMemo(() => ({
    settings, updateSettings,
    layout, updateLayout,
    widgetInstances, setWidgetInstances,
    isEditMode, toggleEditMode,
    theme: settings.theme,
    isLoading,
    t,
  }), [settings, updateSettings, layout, updateLayout, widgetInstances, setWidgetInstances, isEditMode, toggleEditMode, isLoading, t]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}
