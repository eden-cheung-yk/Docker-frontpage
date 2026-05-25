import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Check, Trash2, Calendar, Flag } from 'lucide-react';
import type { WidgetProps, TodoItem } from '../types';
import { apiGet, apiPost, apiPut, apiDelete } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#22c55e',
};

export default function TodoListWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showCompleted = settings.showCompleted !== false;

  const fetch_ = useCallback(async () => {
    try {
      const data = await apiGet<TodoItem[]>('/api/todos');
      setTodos(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const addTodo = async () => {
    const text = newText.trim();
    if (!text) return;
    setNewText('');
    try {
      await apiPost('/api/todos', { text, priority: 'medium' });
      fetch_();
    } catch { /* silent */ }
  };

  const toggleTodo = async (todo: TodoItem) => {
    try {
      await apiPut(`/api/todos/${todo.id}`, { completed: !todo.completed });
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
    } catch { /* silent */ }
  };

  const deleteTodo = async (id: string) => {
    try {
      await apiDelete(`/api/todos/${id}`);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch { /* silent */ }
  };

  const setPriority = async (id: string, priority: string) => {
    try {
      await apiPut(`/api/todos/${id}`, { priority });
      setTodos(prev => prev.map(t => t.id === id ? { ...t, priority: priority as TodoItem['priority'] } : t));
    } catch { /* silent */ }
  };

  const displayed = showCompleted ? todos : todos.filter(t => !t.completed);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', gap: 8,
      }}>
        <input
          placeholder={t('todoWidget.addPlaceholder')}
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTodo(); }}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
            color: 'var(--text-primary)', fontSize: 13,
          }}
        />
        <button onClick={addTodo} style={{
          width: 36, height: 36, borderRadius: 'var(--border-radius)',
          background: 'var(--accent-primary)', color: 'var(--bg-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Plus size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {todos.length === 0 ? t('todoWidget.noTodos') : 'All tasks completed'}
          </div>
        ) : (
          displayed.map((todo, idx) => (
            <div
              key={todo.id}
              style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                animation: `fadeIn 0.3s ease-out ${idx * 30}ms both`,
                opacity: todo.completed ? 0.5 : 1,
                transition: 'opacity var(--transition-fast)',
              }}
            >
              <button
                onClick={() => toggleTodo(todo)}
                style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${todo.completed ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: todo.completed ? 'var(--accent-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--bg-primary)', transition: 'all var(--transition-fast)',
                }}
              >
                {todo.completed && <Check size={12} />}
              </button>

              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === todo.id ? null : todo.id)}>
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}>
                  {todo.text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    padding: '2px 6px', borderRadius: 4,
                    background: `${PRIORITY_COLORS[todo.priority]}22`,
                    color: PRIORITY_COLORS[todo.priority],
                  }}>
                    {todo.priority}
                  </span>
                  {todo.dueDate && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {new Date(todo.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {expandedId === todo.id && (
                  <div style={{
                    display: 'flex', gap: 6, marginTop: 8,
                    animation: 'fadeIn 0.2s ease-out both',
                  }}>
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        onClick={e => { e.stopPropagation(); setPriority(todo.id, p); }}
                        style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          padding: '3px 8px', borderRadius: 4,
                          border: `1px solid ${PRIORITY_COLORS[p]}`,
                          color: PRIORITY_COLORS[p],
                          background: todo.priority === p ? `${PRIORITY_COLORS[p]}22` : 'transparent',
                        }}
                      >
                        <Flag size={8} style={{ marginRight: 3 }} />{p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => deleteTodo(todo.id)}
                style={{
                  width: 24, height: 24, borderRadius: 4, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: 'var(--text-muted)', transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-secondary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
