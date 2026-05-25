import React, { useEffect, useState, useCallback } from 'react';
import { CalendarDays, Clock, Settings } from 'lucide-react';
import type { WidgetProps } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  allDay?: boolean;
}

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function CalendarWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const calDavUrl = settings.calDavUrl as string;

  const fetch_ = useCallback(async () => {
    if (!calDavUrl) { setLoading(false); return; }
    try {
      const data = await apiGet<CalendarEvent[]>('/api/widgets/calendar');
      setEvents(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [calDavUrl]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 300_000);
    return () => clearInterval(id);
  }, [fetch_]);

  if (!calDavUrl) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: 24, color: 'var(--text-muted)', textAlign: 'center',
      }}>
        <Settings size={28} style={{ opacity: 0.4 }} />
        <span style={{ fontSize: 13 }}>{t('calendarWidget.configure')}</span>
      </div>
    );
  }

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const day = new Date(ev.start).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    (acc[day] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13,
      }}>
        <CalendarDays size={14} style={{ color: 'var(--accent-primary)' }} />
        <span>Upcoming Events</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 36 }} />)}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {t('calendarWidget.noEvents')}
          </div>
        ) : (
          Object.entries(grouped).map(([day, evts]) => (
            <div key={day} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8,
                fontFamily: 'var(--font-heading)',
              }}>
                {day}
              </div>
              {evts.map((ev, idx) => (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: idx < evts.length - 1 ? '1px solid var(--border-color)' : 'none',
                  animation: `fadeIn 0.3s ease-out ${idx * 40}ms both`,
                }}>
                  <div style={{
                    width: 4, height: 28, borderRadius: 2, flexShrink: 0,
                    background: ev.color || EVENT_COLORS[idx % EVENT_COLORS.length],
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={10} />
                      {ev.allDay ? 'All day' : new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
