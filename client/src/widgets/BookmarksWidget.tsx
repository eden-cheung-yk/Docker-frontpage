import React, { useEffect, useState, useCallback } from 'react';
import { ExternalLink, Plus, Pencil, Trash2, X, Check, Bookmark as BookmarkIcon } from 'lucide-react';
import type { WidgetProps, Bookmark } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

export default function BookmarksWidget({ isEditMode }: WidgetProps) {
  const { t } = useDashboard();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [form, setForm] = useState({ name: '', url: '', icon: '', group: '' });

  const fetch_ = useCallback(async () => {
    try {
      const data = await apiGet<Bookmark[]>('/api/bookmarks');
      setBookmarks(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openForm = (bm?: Bookmark) => {
    if (bm) {
      setEditing(bm);
      setForm({ name: bm.name, url: bm.url, icon: bm.icon || '', group: bm.group });
    } else {
      setEditing(null);
      setForm({ name: '', url: '', icon: '', group: '' });
    }
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.url) return;
    if (editing) {
      await apiPut(`/api/bookmarks/${editing.id}`, form);
    } else {
      await apiPost('/api/bookmarks', form);
    }
    setShowForm(false);
    fetch_();
  };

  const remove = async (id: string) => {
    await apiDelete(`/api/bookmarks/${id}`);
    fetch_();
  };

  const groups = new Map<string, Bookmark[]>();
  bookmarks.forEach(b => {
    const g = b.group || 'Bookmarks';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(b);
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 'var(--border-radius)',
    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 13,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookmarkIcon size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Bookmarks</span>
        </div>
        <button onClick={() => openForm()} style={{
          width: 26, height: 26, borderRadius: 6, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)',
          transition: 'background var(--transition-fast)',
        }} title={t('bookmarksWidget.addBookmark')}>
          <Plus size={14} />
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: 14, borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex', flexDirection: 'column', gap: 8,
          animation: 'slideInDown 0.2s ease-out both',
        }}>
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inputStyle} placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <input style={inputStyle} placeholder="Group (optional)" value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{
              flex: 1, padding: '8px', borderRadius: 'var(--border-radius)',
              background: 'var(--accent-primary)', color: 'var(--bg-primary)',
              fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <Check size={12} /> {editing ? 'Update' : 'Add'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 12px', borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)', fontSize: 12,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ width: 80, height: 64 }} />)}
          </div>
        ) : bookmarks.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {t('bookmarksWidget.noBookmarks')}
          </div>
        ) : (
          Array.from(groups.entries()).map(([group, bms]) => (
            <div key={group} style={{ marginBottom: 14 }}>
              {groups.size > 1 && (
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6,
                  fontFamily: 'var(--font-heading)',
                }}>
                  {group}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                {bms.map((bm, idx) => (
                  <div key={bm.id} style={{ position: 'relative' }}>
                    <a
                      href={bm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 6, padding: 10, borderRadius: 'var(--border-radius)',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        transition: 'border-color var(--transition-fast)',
                        textDecoration: 'none', color: 'inherit', textAlign: 'center',
                        animation: `fadeIn 0.3s ease-out ${idx * 30}ms both`,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; }}
                    >
                      <ExternalLink size={18} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: 11, fontWeight: 500, wordBreak: 'break-word', lineHeight: 1.2 }}>
                        {bm.name}
                      </span>
                    </a>
                    {isEditMode && (
                      <div style={{
                        position: 'absolute', top: 4, right: 4,
                        display: 'flex', gap: 2,
                      }}>
                        <button onClick={() => openForm(bm)} style={{
                          width: 20, height: 20, borderRadius: 4, background: 'var(--bg-card)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Pencil size={10} />
                        </button>
                        <button onClick={() => remove(bm.id)} style={{
                          width: 20, height: 20, borderRadius: 4, background: 'var(--bg-card)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent-secondary)',
                        }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
