import React, { useEffect, useState, useCallback } from 'react';
import { Rss, ExternalLink, Settings } from 'lucide-react';
import type { WidgetProps } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

interface FeedItem {
  title: string;
  link: string;
  date: string;
  summary: string;
}

export default function RssFeedWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const feedUrls = (settings.feedUrls as string[]) || [];
  const maxItems = (settings.maxItems as number) || 10;

  const fetch_ = useCallback(async () => {
    if (feedUrls.length === 0) { setLoading(false); return; }
    try {
      const data = await apiGet<FeedItem[]>(
        `/api/widgets/rss?urls=${encodeURIComponent(feedUrls.join(','))}&max=${maxItems}`
      );
      setItems(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [feedUrls.join(','), maxItems]);

  useEffect(() => {
    fetch_();
    const interval = ((settings.refreshInterval as number) || 300) * 1000;
    const id = setInterval(fetch_, interval);
    return () => clearInterval(id);
  }, [fetch_, settings.refreshInterval]);

  if (feedUrls.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: 24, color: 'var(--text-muted)', textAlign: 'center',
      }}>
        <Settings size={28} style={{ opacity: 0.4 }} />
        <span style={{ fontSize: 13 }}>{t('rssWidget.configureFeeds')}</span>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 13,
      }}>
        <Rss size={14} style={{ color: 'var(--accent-primary)' }} />
        <span>Latest Headlines</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {items.length} items
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No articles found
          </div>
        ) : (
          items.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', padding: '10px 16px',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background var(--transition-fast)',
                animation: `fadeIn 0.3s ease-out ${idx * 40}ms both`,
                textDecoration: 'none', color: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{
                fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                display: 'flex', gap: 6, alignItems: 'flex-start',
              }}>
                <span style={{ flex: 1 }}>{item.title}</span>
                <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
              </div>
              {item.summary && (
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)', marginTop: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.summary}
                </div>
              )}
              {item.date && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(item.date).toLocaleDateString()}
                </div>
              )}
            </a>
          ))
        )}
      </div>
    </div>
  );
}
