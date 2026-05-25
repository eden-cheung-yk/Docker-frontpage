import React, { useEffect, useState, useCallback } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, CloudFog, Settings } from 'lucide-react';
import type { WidgetProps } from '../types';
import { apiGet } from '../hooks/useApi';
import { useDashboard } from '../context/DashboardContext';

interface WeatherData {
  city: string;
  temperature: number;
  feelsLike: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

const WEATHER_ICONS: Record<string, React.ElementType> = {
  clear: Sun, sunny: Sun, clouds: Cloud, cloudy: Cloud,
  rain: CloudRain, drizzle: CloudRain, thunderstorm: CloudLightning,
  snow: CloudSnow, mist: CloudFog, fog: CloudFog, haze: CloudFog,
};

const WEATHER_GRADIENTS: Record<string, string> = {
  clear: 'linear-gradient(135deg, #f59e0b33, #f9731622)',
  sunny: 'linear-gradient(135deg, #f59e0b33, #f9731622)',
  clouds: 'linear-gradient(135deg, #64748b22, #94a3b822)',
  rain: 'linear-gradient(135deg, #3b82f622, #6366f122)',
  snow: 'linear-gradient(135deg, #e2e8f022, #cbd5e122)',
  thunderstorm: 'linear-gradient(135deg, #7c3aed22, #4338ca22)',
};

function getWeatherIcon(conditions: string): React.ElementType {
  const lower = conditions.toLowerCase();
  for (const [key, Icon] of Object.entries(WEATHER_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return Cloud;
}

function getGradient(conditions: string): string {
  const lower = conditions.toLowerCase();
  for (const [key, grad] of Object.entries(WEATHER_GRADIENTS)) {
    if (lower.includes(key)) return grad;
  }
  return 'linear-gradient(135deg, #64748b11, #94a3b811)';
}

export default function WeatherWidget({ settings }: WidgetProps) {
  const { t } = useDashboard();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiKey = settings.apiKey as string;
  const city = settings.city as string;
  const units = (settings.units as string) || 'metric';

  const fetch_ = useCallback(async () => {
    if (!apiKey || !city) { setLoading(false); return; }
    try {
      const d = await apiGet<WeatherData>(`/api/widgets/weather?city=${encodeURIComponent(city)}&units=${units}`);
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [apiKey, city, units]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 600_000);
    return () => clearInterval(id);
  }, [fetch_]);

  if (!apiKey || !city) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: 24, color: 'var(--text-muted)', textAlign: 'center',
      }}>
        <Settings size={28} style={{ opacity: 0.4 }} />
        <span style={{ fontSize: 13 }}>{t('weatherWidget.configureKey')}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 24, width: '50%' }} />
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 20, color: 'var(--accent-secondary)', fontSize: 13 }}>
        {error || 'No data available'}
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(data.conditions);
  const unitSymbol = units === 'imperial' ? '°F' : '°C';

  return (
    <div style={{
      height: '100%', padding: 20, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      background: getGradient(data.conditions),
      animation: 'fadeIn 0.5s ease-out both',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
            fontFamily: 'var(--font-heading)', textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {data.city}
          </div>
          <div style={{
            fontSize: 48, fontWeight: 300, lineHeight: 1.1, marginTop: 4,
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, var(--text-primary), var(--accent-primary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {Math.round(data.temperature)}{unitSymbol}
          </div>
        </div>
        <WeatherIcon size={40} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, textTransform: 'capitalize' }}>
          {data.conditions}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Droplets size={12} /> {data.humidity}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wind size={12} /> {data.windSpeed} {units === 'imperial' ? 'mph' : 'm/s'}
          </span>
        </div>
      </div>
    </div>
  );
}
