import React from 'react';
import type { WidgetDefinition, SettingsField } from '../types';

interface RegistryEntry extends WidgetDefinition {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

const field = (
  key: string, label: string, type: SettingsField['type'],
  defaultValue: unknown, extra?: Partial<SettingsField>,
): SettingsField => ({ key, label, type, defaultValue, ...extra });

export const WIDGET_REGISTRY: Record<string, RegistryEntry> = {
  'docker-services': {
    id: 'docker-services',
    name: 'Docker Services',
    description: 'Auto-detected Docker containers with status and quick links',
    icon: 'Container',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 12, h: 6 },
    settingsSchema: [
      field('refreshInterval', 'Refresh Interval (s)', 'number', 30, { min: 5 }),
      field('cardSize', 'Card Size', 'select', 'normal', {
        options: [
          { label: 'Compact', value: 'compact' },
          { label: 'Normal', value: 'normal' },
          { label: 'Large', value: 'large' },
        ],
      }),
    ],
    component: React.lazy(() => import('./DockerServicesWidget')),
  },

  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather conditions and temperature',
    icon: 'CloudSun',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    settingsSchema: [
      field('city', 'City', 'text', '', { placeholder: 'London' }),
      field('units', 'Units', 'select', 'metric', {
        options: [
          { label: 'Celsius', value: 'metric' },
          { label: 'Fahrenheit', value: 'imperial' },
        ],
      }),
      field('apiKey', 'API Key', 'password', '', { placeholder: 'OpenWeatherMap API key' }),
    ],
    component: React.lazy(() => import('./WeatherWidget')),
  },

  'rss-feed': {
    id: 'rss-feed',
    name: 'RSS Feed',
    description: 'Headlines from your favourite RSS and Atom feeds',
    icon: 'Rss',
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 6 },
    settingsSchema: [
      field('feedUrls', 'Feed URLs', 'tags', [], { placeholder: 'https://example.com/feed.xml' }),
      field('maxItems', 'Max Items', 'number', 10, { min: 1, max: 50 }),
      field('refreshInterval', 'Refresh Interval (s)', 'number', 300, { min: 60 }),
    ],
    component: React.lazy(() => import('./RssFeedWidget')),
  },

  'stock-ticker': {
    id: 'stock-ticker',
    name: 'Stock Ticker',
    description: 'Live stock prices and daily change',
    icon: 'TrendingUp',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 6, h: 4 },
    settingsSchema: [
      field('symbols', 'Symbols', 'tags', [], { placeholder: 'AAPL' }),
      field('apiKey', 'API Key', 'password', '', { placeholder: 'Alpha Vantage key' }),
      field('refreshInterval', 'Refresh Interval (s)', 'number', 300, { min: 60 }),
    ],
    component: React.lazy(() => import('./StockTickerWidget')),
  },

  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Upcoming events from your CalDAV server',
    icon: 'CalendarDays',
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 6 },
    settingsSchema: [
      field('calDavUrl', 'CalDAV URL', 'url', '', { placeholder: 'https://nextcloud.example.com/dav' }),
      field('username', 'Username', 'text', ''),
      field('password', 'Password', 'password', ''),
      field('daysAhead', 'Days Ahead', 'number', 7, { min: 1, max: 30 }),
    ],
    component: React.lazy(() => import('./CalendarWidget')),
  },

  bookmarks: {
    id: 'bookmarks',
    name: 'Bookmarks',
    description: 'Quick-access links organized by group',
    icon: 'Bookmark',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 6, h: 4 },
    settingsSchema: [],
    component: React.lazy(() => import('./BookmarksWidget')),
  },

  'system-monitor': {
    id: 'system-monitor',
    name: 'System Monitor',
    description: 'Host CPU, memory and disk usage',
    icon: 'Cpu',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 4 },
    settingsSchema: [
      field('refreshInterval', 'Refresh Interval (s)', 'number', 5, { min: 2 }),
      field('showCpu', 'Show CPU', 'toggle', true),
      field('showMemory', 'Show Memory', 'toggle', true),
      field('showDisk', 'Show Disk', 'toggle', true),
    ],
    component: React.lazy(() => import('./SystemMonitorWidget')),
  },

  'todo-list': {
    id: 'todo-list',
    name: 'To-Do List',
    description: 'Simple task tracking with priorities',
    icon: 'ListChecks',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 6 },
    settingsSchema: [
      field('showCompleted', 'Show Completed', 'toggle', true),
      field('sortOrder', 'Sort Order', 'select', 'manual', {
        options: [
          { label: 'Manual', value: 'manual' },
          { label: 'Priority', value: 'priority' },
          { label: 'Due Date', value: 'dueDate' },
        ],
      }),
    ],
    component: React.lazy(() => import('./TodoListWidget')),
  },

  'sticky-notes': {
    id: 'sticky-notes',
    name: 'Sticky Notes',
    description: 'Colorful quick notes',
    icon: 'StickyNote',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 4, h: 4 },
    settingsSchema: [
      field('defaultColor', 'Default Color', 'color', '#fef08a'),
      field('fontSize', 'Font Size', 'select', 'medium', {
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      }),
    ],
    component: React.lazy(() => import('./StickyNotesWidget')),
  },

  'speed-test': {
    id: 'speed-test',
    name: 'Speed Test',
    description: 'Network speed test with history',
    icon: 'Gauge',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    settingsSchema: [
      field('autoInterval', 'Auto Interval (min, 0=manual)', 'number', 0, { min: 0 }),
    ],
    component: React.lazy(() => import('./SpeedTestWidget')),
  },

  'uptime-monitor': {
    id: 'uptime-monitor',
    name: 'Uptime Monitor',
    description: 'Monitor service availability and response times',
    icon: 'Activity',
    defaultSize: { w: 2, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 6 },
    settingsSchema: [],
    component: React.lazy(() => import('./UptimeMonitorWidget')),
  },

  'ip-network': {
    id: 'ip-network',
    name: 'IP / Network',
    description: 'Network information and IP addresses',
    icon: 'Globe',
    defaultSize: { w: 2, h: 1 },
    minSize: { w: 2, h: 1 },
    maxSize: { w: 4, h: 2 },
    settingsSchema: [
      field('checkInterval', 'Check Interval (s)', 'number', 300, { min: 30 }),
      field('showInternal', 'Show Internal IP', 'toggle', true),
      field('showExternal', 'Show External IP', 'toggle', true),
    ],
    component: React.lazy(() => import('./IpNetworkWidget')),
  },
};

export function getWidgetComponent(type: string) {
  return WIDGET_REGISTRY[type]?.component ?? null;
}

export function getWidgetDefinition(type: string): WidgetDefinition | null {
  if (!WIDGET_REGISTRY[type]) return null;
  const { component: _, ...def } = WIDGET_REGISTRY[type];
  return def;
}

export function getAllWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).map(({ component: _, ...def }) => def);
}
