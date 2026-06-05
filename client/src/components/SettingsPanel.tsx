import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Upload, RotateCcw, Check, Server, Plus, Pencil, Trash2, ExternalLink, Globe } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../hooks/useApi';
import { LANGUAGES } from '../i18n';

const TAB_KEYS = ['General', 'Appearance', 'Services', 'Docker', 'Widgets', 'Data', 'System'] as const;
type Tab = typeof TAB_KEYS[number];
const TAB_I18N: Record<Tab, string> = {
  General: 'settings.tabs.general', Appearance: 'settings.tabs.appearance', Services: 'settings.tabs.services',
  Docker: 'settings.tabs.docker', Widgets: 'settings.tabs.widgets', Data: 'settings.tabs.data', System: 'settings.tabs.system',
};

const THEMES = [
  { id: 'dark-neon', name: 'Dark Neon', colors: ['#0a0e1a', '#111827', '#00f0ff', '#e94560'] },
  { id: 'glassmorphism', name: 'Glassmorphism', colors: ['#1a1a3e', '#2d1b69', '#a78bfa', '#f472b6'] },
  { id: 'minimal-light', name: 'Minimal Light', colors: ['#fafaf9', '#ffffff', '#1a1a1a', '#dc2626'] },
  { id: 'material-dark', name: 'Material Dark', colors: ['#121212', '#1e1e1e', '#03dac6', '#ff9800'] },
  { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#0a0a0a', '#111111', '#00ff41', '#ff2d6a'] },
];

interface SettingsPanelProps {
  onClose: () => void;
}

interface SystemInfo {
  version: string;
  buildDate: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: string;
  startedAt: string;
  environment: string;
  port: number;
  dataDir: string;
  pid: number;
  memoryUsage: { rss: number; heapUsed: number; heapTotal: number };
}

interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  group: string | null;
  group_name?: string | null;
  description: string | null;
  isManual?: boolean;
  status?: string;
  image?: string;
}

const emptyService = { name: '', url: '', icon: '', group_name: '', description: '' };

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings, t } = useDashboard();
  const [tab, setTab] = useState<Tab>('General');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [addingService, setAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const data = await apiGet<ServiceEntry[]>('/api/docker/containers');
      setServices(data);
    } catch { /* silent */ }
    finally { setServicesLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'Services' && services.length === 0 && !servicesLoading) {
      loadServices();
    }
  }, [tab, services.length, servicesLoading, loadServices]);

  useEffect(() => {
    if (tab === 'System' && !systemInfo) {
      apiGet<SystemInfo>('/api/system/info').then(setSystemInfo).catch(() => {});
    }
  }, [tab, systemInfo]);

  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.url) return;
    try {
      await apiPost('/api/docker/services', serviceForm);
      setServiceForm(emptyService);
      setAddingService(false);
      loadServices();
    } catch { /* silent */ }
  };

  const handleUpdateService = async (id: string) => {
    try {
      await apiPut(`/api/docker/services/${id}`, serviceForm);
      setEditingService(null);
      setServiceForm(emptyService);
      loadServices();
    } catch { /* silent */ }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await apiDelete(`/api/docker/services/${id}`);
      setDeleteConfirmId(null);
      loadServices();
    } catch { /* silent */ }
  };

  const startEditing = (svc: ServiceEntry) => {
    setEditingService(svc.id);
    setAddingService(false);
    setServiceForm({
      name: svc.name,
      url: svc.url || '',
      icon: svc.icon || '',
      group_name: svc.group || svc.group_name || '',
      description: svc.description || '',
    });
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    padding: '40px 16px',
    animation: 'fadeIn 0.2s ease-out both',
    overflowY: 'auto',
  };

  const panel: React.CSSProperties = {
    width: 640, maxWidth: '100%',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideInDown 0.3s ease-out both',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20,
  };

  const tabBar: React.CSSProperties = {
    display: 'flex', gap: 0,
    borderBottom: '1px solid var(--border-color)',
    overflowX: 'auto',
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '12px 20px', fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font-heading)',
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  });

  const body: React.CSSProperties = { padding: 24 };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)', color: 'var(--text-primary)',
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 6, fontSize: 13,
    fontWeight: 500, color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
  };

  const sectionGap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 'var(--border-radius)',
    background: 'var(--accent-primary)', color: 'var(--bg-primary)',
    fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
    transition: 'opacity var(--transition-fast)',
  };

  const btnOutline: React.CSSProperties = {
    ...btnPrimary,
    background: 'transparent', color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  };

  const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    background: 'var(--accent-secondary)',
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/settings/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dockerdash-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silently fail */ }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await fetch('/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      window.location.reload();
    } catch { /* silently fail */ }
  };

  const handleReset = async () => {
    await fetch('/api/layout/reset', { method: 'POST' });
    window.location.reload();
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panel}>
        <div style={headerStyle}>
          <span>{t('settings.title')}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={tabBar}>
          {TAB_KEYS.map(tk => (
            <button key={tk} onClick={() => setTab(tk)} style={tabBtn(tab === tk)}>{t(TAB_I18N[tk])}</button>
          ))}
        </div>

        <div style={body}>
          {tab === 'General' && (
            <div style={sectionGap}>
              <div>
                <label style={labelStyle}>{t('general.dashboardTitle')}</label>
                <input style={inputStyle} value={settings.title} onChange={e => updateSettings({ title: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>{t('general.displayName')}</label>
                <input
                  style={inputStyle}
                  value={settings.displayName}
                  onChange={e => updateSettings({ displayName: e.target.value })}
                  placeholder={t('general.displayNamePlaceholder')}
                />
              </div>
              <div>
                <label style={labelStyle}>{t('general.smartHeader')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.showSmartHeader}
                      onChange={e => updateSettings({ showSmartHeader: e.target.checked })}
                    />
                    {t('general.showSmartHeader')}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.showHealthPills}
                      onChange={e => updateSettings({ showHealthPills: e.target.checked })}
                      disabled={!settings.showSmartHeader}
                    />
                    {t('general.showHealthPills')}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.showSearch}
                      onChange={e => updateSettings({ showSearch: e.target.checked })}
                      disabled={!settings.showSmartHeader}
                    />
                    {t('general.showSearch')}
                  </label>
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('general.language')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => updateSettings({ language: lang.code })}
                      style={{
                        padding: '10px 14px', borderRadius: 'var(--border-radius)',
                        border: settings.language === lang.code ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        textAlign: 'left', transition: 'border-color var(--transition-fast)',
                        position: 'relative',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{lang.flag}</span>
                      <span style={{ fontSize: 13, fontWeight: settings.language === lang.code ? 700 : 400, fontFamily: 'var(--font-heading)' }}>
                        {lang.name}
                      </span>
                      {settings.language === lang.code && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'var(--accent-primary)', color: 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'Appearance' && (
            <div style={sectionGap}>
              <div>
                <label style={labelStyle}>{t('appearance.theme')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => updateSettings({ theme: t.id })}
                      style={{
                        padding: 12, borderRadius: 'var(--border-radius)',
                        border: settings.theme === t.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        textAlign: 'left', transition: 'border-color var(--transition-fast)',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {t.colors.map((c, i) => (
                          <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: '1px solid rgba(128,128,128,0.2)' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{t.name}</span>
                      {settings.theme === t.id && (
                        <div style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'var(--accent-primary)', color: 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('appearance.accentColor')}</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={settings.accentColor} onChange={e => updateSettings({ accentColor: e.target.value })}
                    style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                  <input style={{ ...inputStyle, flex: 1 }} value={settings.accentColor} onChange={e => updateSettings({ accentColor: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t('appearance.fontSize')}</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={settings.fontSize} onChange={e => updateSettings({ fontSize: e.target.value as DashboardSettings['fontSize'] })}>
                  <option value="small">{t('appearance.fontSmall')}</option>
                  <option value="medium">{t('appearance.fontMedium')}</option>
                  <option value="large">{t('appearance.fontLarge')}</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'Services' && (
            <div style={sectionGap}>
              <div style={{
                padding: '14px 18px', borderRadius: 'var(--border-radius)',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>{t('services.howItWorks')}</strong> {t('services.description')}
              </div>

              {servicesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {services.map(svc => (
                    <div key={svc.id} style={{
                      padding: '14px 18px', borderRadius: 'var(--border-radius)',
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      animation: 'fadeIn 0.3s ease-out both',
                    }}>
                      {editingService === svc.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13, color: 'var(--accent-primary)', marginBottom: 4 }}>
                            {t('services.edit')}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.name')} *</label>
                              <input style={inputStyle} value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder={t('services.namePlaceholder')} />
                            </div>
                            <div>
                              <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.url')} *</label>
                              <input style={inputStyle} value={serviceForm.url} onChange={e => setServiceForm(f => ({ ...f, url: e.target.value }))} placeholder={t('services.urlPlaceholder')} />
                            </div>
                            <div>
                              <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.group')}</label>
                              <input style={inputStyle} value={serviceForm.group_name} onChange={e => setServiceForm(f => ({ ...f, group_name: e.target.value }))} placeholder={t('services.groupPlaceholder')} />
                            </div>
                            <div>
                              <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.descriptionField')}</label>
                              <input style={inputStyle} value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder={t('services.descriptionPlaceholder')} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ ...btnPrimary, fontSize: 12, padding: '8px 16px' }} onClick={() => handleUpdateService(svc.id)}>{t('services.save')}</button>
                            <button style={{ ...btnOutline, fontSize: 12, padding: '8px 16px' }} onClick={() => { setEditingService(null); setServiceForm(emptyService); }}>{t('services.cancel')}</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: svc.isManual ? 'rgba(var(--accent-primary), 0.1)' : 'var(--bg-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-primary)', flexShrink: 0,
                          }}>
                            {svc.isManual ? <Globe size={18} /> : <Server size={18} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{svc.name}</span>
                              <span style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 10,
                                background: svc.isManual ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: svc.isManual ? 'var(--bg-primary)' : 'var(--text-muted)',
                                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                              }}>
                                {svc.isManual ? t('services.manual') : t('services.docker')}
                              </span>
                              {svc.group && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {svc.group}</span>
                              )}
                            </div>
                            {svc.url && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {svc.url}
                              </div>
                            )}
                            {svc.description && (
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{svc.description}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            {svc.url && (
                              <a href={svc.url} target="_blank" rel="noopener noreferrer" style={{
                                width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)', transition: 'color var(--transition-fast)',
                              }} title={t('services.openLink')}>
                                <ExternalLink size={14} />
                              </a>
                            )}
                            {svc.isManual && (
                              <>
                                <button onClick={() => startEditing(svc)} style={{
                                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--text-muted)', transition: 'color var(--transition-fast)',
                                }} title="Edit">
                                  <Pencil size={14} />
                                </button>
                                {deleteConfirmId === svc.id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                                    <button style={{ ...btnDanger, padding: '4px 10px', fontSize: 11 }} onClick={() => handleDeleteService(svc.id)}>{t('services.delete')}</button>
                                    <button style={{ ...btnOutline, padding: '4px 10px', fontSize: 11 }} onClick={() => setDeleteConfirmId(null)}>{t('widget.no')}</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirmId(svc.id)} style={{
                                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--accent-secondary)', transition: 'color var(--transition-fast)',
                                  }} title={t('services.delete')}>
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {services.length === 0 && !addingService && (
                    <div style={{
                      textAlign: 'center', padding: '32px 16px',
                      color: 'var(--text-muted)', fontSize: 13,
                    }}>
                      {t('services.noServices')}
                    </div>
                  )}
                </div>
              )}

              {addingService ? (
                <div style={{
                  padding: '18px', borderRadius: 'var(--border-radius)',
                  background: 'var(--bg-card)', border: '2px solid var(--accent-primary)',
                }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, marginBottom: 14, color: 'var(--accent-primary)' }}>
                    {t('services.addNew')}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.name')} *</label>
                      <input style={inputStyle} value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))} placeholder={t('services.namePlaceholder')} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.url')} *</label>
                      <input style={inputStyle} value={serviceForm.url} onChange={e => setServiceForm(f => ({ ...f, url: e.target.value }))} placeholder={t('services.urlPlaceholder')} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.group')}</label>
                      <input style={inputStyle} value={serviceForm.group_name} onChange={e => setServiceForm(f => ({ ...f, group_name: e.target.value }))} placeholder={t('services.groupPlaceholder')} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 11 }}>{t('services.descriptionField')}</label>
                      <input style={inputStyle} value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder={t('services.descriptionPlaceholder')} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button style={btnPrimary} onClick={handleAddService} disabled={!serviceForm.name || !serviceForm.url}>
                      <Plus size={14} /> {t('services.addButton')}
                    </button>
                    <button style={btnOutline} onClick={() => { setAddingService(false); setServiceForm(emptyService); }}>{t('services.cancel')}</button>
                  </div>
                </div>
              ) : (
                <button
                  style={{ ...btnOutline, width: '100%', justifyContent: 'center' }}
                  onClick={() => { setAddingService(true); setEditingService(null); setServiceForm(emptyService); }}
                >
                  <Plus size={16} /> {t('services.addManually')}
                </button>
              )}

              <button style={{ ...btnOutline, fontSize: 12, padding: '8px 16px', alignSelf: 'flex-start' }} onClick={loadServices}>
                <RotateCcw size={12} /> {t('services.refreshList')}
              </button>
            </div>
          )}

          {tab === 'Docker' && (
            <div style={sectionGap}>
              <div style={{
                padding: '14px 18px', borderRadius: 'var(--border-radius)',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>{t('docker.info')}</strong> {t('docker.infoDesc')}
              </div>
              <div>
                <label style={labelStyle}>{t('docker.hostUrl')}</label>
                <input style={inputStyle} value={settings.hostUrl} placeholder="http://192.168.1.100" onChange={e => updateSettings({ hostUrl: e.target.value })} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  {t('docker.hostUrlHelp')}
                </span>
              </div>
              <div>
                <label style={labelStyle}>{t('docker.scanInterval')}</label>
                <input style={inputStyle} type="number" min={5} value={settings.dockerScanInterval} onChange={e => updateSettings({ dockerScanInterval: Number(e.target.value) })} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  {t('docker.scanIntervalHelp')}
                </span>
              </div>
              <div>
                <label style={labelStyle}>{t('docker.socketPath')}</label>
                <input style={inputStyle} value={settings.dockerSocketPath} onChange={e => updateSettings({ dockerSocketPath: e.target.value })} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  {t('docker.socketPathHelp')}
                </span>
              </div>
              <div>
                <label style={labelStyle}>{t('docker.containerFilter')}</label>
                <input style={inputStyle} value={settings.containerFilter} placeholder={t('docker.filterPlaceholder')} onChange={e => updateSettings({ containerFilter: e.target.value })} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  {t('docker.containerFilterHelp')}
                </span>
              </div>
            </div>
          )}

          {tab === 'Widgets' && (
            <div style={sectionGap}>
              <div style={{
                padding: '14px 18px', borderRadius: 'var(--border-radius)',
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>{t('widgets.howTo')}</strong>
                <ol style={{ marginTop: 8, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>{t('widgets.step1')}</li>
                  <li>{t('widgets.step2')}</li>
                  <li>{t('widgets.step3')}</li>
                  <li>{t('widgets.step4')}</li>
                  <li>{t('widgets.step5')}</li>
                  <li>{t('widgets.step6')}</li>
                </ol>
              </div>
            </div>
          )}

          {tab === 'Data' && (
            <div style={sectionGap}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button style={btnPrimary} onClick={handleExport}>
                  <Download size={16} /> {t('data.exportConfig')}
                </button>
                <button style={btnOutline} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> {t('data.importConfig')}
                </button>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                {!confirmReset ? (
                  <button style={btnDanger} onClick={() => setConfirmReset(true)}>
                    <RotateCcw size={16} /> {t('data.resetDefaults')}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, color: 'var(--accent-secondary)' }}>{t('data.confirmReset')}</span>
                    <button style={btnDanger} onClick={handleReset}>{t('data.yesReset')}</button>
                    <button style={btnOutline} onClick={() => setConfirmReset(false)}>{t('services.cancel')}</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'System' && (
            <div style={sectionGap}>
              {systemInfo ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 20px', borderRadius: 'var(--border-radius)',
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  }}>
                    <Server size={24} style={{ color: 'var(--accent-primary)' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>
                        DockerDash v{systemInfo.version}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {t('system.build')}: {systemInfo.buildDate === 'dev' ? t('system.development') : systemInfo.buildDate}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {([
                      [t('system.uptime'), systemInfo.uptime],
                      [t('system.started'), new Date(systemInfo.startedAt).toLocaleString()],
                      [t('system.environment'), systemInfo.environment],
                      ['Node.js', systemInfo.nodeVersion],
                      [t('system.platform'), `${systemInfo.platform} / ${systemInfo.arch}`],
                      [t('system.port'), String(systemInfo.port)],
                      [t('system.dataDir'), systemInfo.dataDir],
                      ['PID', String(systemInfo.pid)],
                      [t('system.memoryRss'), `${systemInfo.memoryUsage.rss} MB`],
                      [t('system.heapUsed'), `${systemInfo.memoryUsage.heapUsed} / ${systemInfo.memoryUsage.heapTotal} MB`],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} style={{
                        padding: '12px 16px', borderRadius: 'var(--border-radius)',
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    style={btnOutline}
                    onClick={() => { setSystemInfo(null); }}
                  >
                    <RotateCcw size={14} /> {t('system.refresh')}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="skeleton" style={{ width: '100%', height: 200 }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type DashboardSettings = import('../types').DashboardSettings;
