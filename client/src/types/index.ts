export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  /** Human-readable status from Docker, e.g. "Up 2 hours" */
  status: string;
  /** Machine state from Docker, e.g. "running", "exited" */
  state: string;
  health?: 'healthy' | 'unhealthy' | 'starting' | 'none';
  ports: PortMapping[];
  url: string | null;
  icon?: string;
  group?: string;
  description?: string;
  isManual?: boolean;
}

export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: string;
}

export interface ManualService {
  id: string;
  name: string;
  url: string;
  icon?: string;
  group?: string;
  description?: string;
}

export interface WidgetInstance {
  instanceId: string;
  widgetType: string;
  settings: Record<string, unknown>;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardSettings {
  title: string;
  theme: string;
  language: string;
  displayName: string;
  showSmartHeader: boolean;
  showHealthPills: boolean;
  showSearch: boolean;
  accentColor: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  fontSize: 'small' | 'medium' | 'large';
  dockerSocketPath: string;
  dockerScanInterval: number;
  hostUrl: string;
  containerFilter: string;
}

export type SettingsFieldType = 'text' | 'number' | 'select' | 'toggle' | 'color' | 'url' | 'password' | 'textarea' | 'tags';

export interface SettingsField {
  key: string;
  label: string;
  type: SettingsFieldType;
  defaultValue: unknown;
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  required?: boolean;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize: { w: number; h: number };
  settingsSchema: SettingsField[];
}

export interface WidgetProps {
  instanceId: string;
  settings: Record<string, unknown>;
  isEditMode: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  sortOrder: number;
}

export interface StickyNote {
  id: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface UptimeTarget {
  id: string;
  name: string;
  url: string;
  interval: number;
  timeout: number;
}

export interface UptimeStatus {
  targetId: string;
  name: string;
  url: string;
  isUp: boolean;
  responseTime: number;
  uptimePercentage: number;
  lastChecked: string;
}

export interface SpeedTestResult {
  id: string;
  timestamp: string;
  download: number;
  upload: number;
  ping: number;
}

export interface NetworkInfo {
  internalIp: string;
  externalIp: string;
  hostname: string;
  gateway: string;
  dns: string[];
}

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  icon?: string;
  group: string;
  sortOrder: number;
}
