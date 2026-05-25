import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Palette } from 'lucide-react';
import type { WidgetProps, StickyNote } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

const COLORS = ['#fef08a', '#fca5a5', '#86efac', '#93c5fd', '#d8b4fe', '#fde68a', '#f9a8d4'];

export default function StickyNotesWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  const defaultColor = (settings.defaultColor as string) || '#fef08a';
  const fontSize = { small: 12, medium: 14, large: 16 }[(settings.fontSize as string) || 'medium'] ?? 14;

  const fetch_ = useCallback(async () => {
    try {
      const data = await apiGet<StickyNote[]>('/api/notes');
      setNotes(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const addNote = async () => {
    try {
      await apiPost('/api/notes', { content: '', color: defaultColor });
      fetch_();
    } catch { /* silent */ }
  };

  const updateNote = async (id: string, updates: Partial<StickyNote>) => {
    try {
      await apiPut(`/api/notes/${id}`, updates);
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    } catch { /* silent */ }
  };

  const deleteNote = async (id: string) => {
    try {
      await apiDelete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 14px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
        <button onClick={addNote} style={{
          width: 28, height: 28, borderRadius: 6, display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)',
        }} title={t('notesWidget.addNote')}>
          <Plus size={16} />
        </button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: 10,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 8, alignContent: 'start',
      }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)
        ) : notes.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1', padding: 24, textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            {t('notesWidget.noNotes')}
          </div>
        ) : (
          notes.map((note, idx) => (
            <div
              key={note.id}
              style={{
                borderRadius: 'var(--border-radius)',
                background: note.color || defaultColor,
                padding: 10, position: 'relative',
                minHeight: 80, display: 'flex', flexDirection: 'column',
                animation: `fadeIn 0.3s ease-out ${idx * 40}ms both`,
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <textarea
                value={note.content}
                onChange={e => updateNote(note.id, { content: e.target.value })}
                onFocus={() => setEditingId(note.id)}
                onBlur={() => setEditingId(null)}
                placeholder="Type here..."
                style={{
                  flex: 1, resize: 'none', background: 'transparent',
                  color: '#1a1a1a', fontSize, lineHeight: 1.4, border: 'none',
                  outline: 'none', minHeight: 40,
                }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 6, opacity: editingId === note.id ? 1 : 0.4,
                transition: 'opacity var(--transition-fast)',
              }}>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setColorPickerId(colorPickerId === note.id ? null : note.id)} style={{
                    width: 20, height: 20, borderRadius: 4, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#555',
                  }}>
                    <Palette size={12} />
                  </button>
                  {colorPickerId === note.id && (
                    <div style={{
                      position: 'absolute', bottom: 24, left: 0,
                      display: 'flex', gap: 4, padding: 6,
                      background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 10,
                    }}>
                      {COLORS.map(c => (
                        <button key={c} onClick={() => { updateNote(note.id, { color: c }); setColorPickerId(null); }}
                          style={{
                            width: 20, height: 20, borderRadius: '50%', background: c,
                            border: note.color === c ? '2px solid #333' : '1px solid #ddd',
                          }} />
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteNote(note.id)} style={{
                  width: 20, height: 20, borderRadius: 4, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#b91c1c',
                }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
