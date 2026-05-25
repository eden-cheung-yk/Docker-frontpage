import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import Parser from 'rss-parser';
import os from 'os';
import fs from 'fs';

const router = Router();
const rssParser = new Parser();

router.get('/weather', async (req: Request, res: Response) => {
  try {
    const { city, units, apiKey } = req.query as { city?: string; units?: string; apiKey?: string };
    if (!city || !apiKey) {
      res.status(400).json({ error: 'city and apiKey query params are required' });
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units || 'metric'}&appid=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      res.status(response.status).json({ error: 'Weather API error', details: data });
      return;
    }

    const weather = data.weather as { main: string; description: string; icon: string }[];
    const main = data.main as { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number };
    const wind = data.wind as { speed: number };

    res.json({
      city: data.name,
      temp: main.temp,
      feelsLike: main.feels_like,
      humidity: main.humidity,
      tempMin: main.temp_min,
      tempMax: main.temp_max,
      condition: weather?.[0]?.main,
      description: weather?.[0]?.description,
      icon: weather?.[0]?.icon,
      windSpeed: wind?.speed,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

router.get('/rss', async (req: Request, res: Response) => {
  try {
    const { feedUrl } = req.query as { feedUrl?: string };
    if (!feedUrl) {
      res.status(400).json({ error: 'feedUrl query param is required' });
      return;
    }

    const feed = await rssParser.parseURL(feedUrl);
    res.json({
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items: (feed.items || []).slice(0, 20).map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        content: item.contentSnippet || item.content,
        author: item.creator || item.author,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse RSS feed' });
  }
});

router.get('/stocks', async (req: Request, res: Response) => {
  try {
    const { symbols, apiKey } = req.query as { symbols?: string; apiKey?: string };
    if (!symbols || !apiKey) {
      res.status(400).json({ error: 'symbols and apiKey query params are required' });
      return;
    }

    const symbolList = symbols.split(',').map((s) => s.trim());
    const results = await Promise.all(
      symbolList.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = (await response.json()) as Record<string, Record<string, string>>;
        const quote = data['Global Quote'];
        if (!quote) return { symbol, error: 'No data' };

        return {
          symbol: quote['01. symbol'] || symbol,
          price: parseFloat(quote['05. price'] || '0'),
          change: parseFloat(quote['09. change'] || '0'),
          changePercent: quote['10. change percent'] || '0%',
          volume: parseInt(quote['06. volume'] || '0', 10),
          latestDay: quote['07. latest trading day'],
        };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

router.get('/calendar', (_req: Request, res: Response) => {
  res.json({
    events: [
      { id: '1', title: 'Sample Event', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString(), allDay: false },
      { id: '2', title: 'All Day Event', start: new Date().toISOString().split('T')[0], allDay: true },
    ],
    message: 'CalDAV integration placeholder — configure in widget settings',
  });
});

router.get('/system', (_req: Request, res: Response) => {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    let cpuUsage: number | null = null;
    try {
      const statContent = fs.readFileSync('/host/proc/stat', 'utf-8');
      const cpuLine = statContent.split('\n').find((l) => l.startsWith('cpu '));
      if (cpuLine) {
        const parts = cpuLine.trim().split(/\s+/).slice(1).map(Number);
        const idle = parts[3];
        const total = parts.reduce((a, b) => a + b, 0);
        cpuUsage = Math.round(((total - idle) / total) * 100);
      }
    } catch {
      const load = os.loadavg();
      cpuUsage = Math.round((load[0] / cpus.length) * 100);
    }

    let diskInfo = null;
    try {
      const meminfo = fs.readFileSync('/host/proc/meminfo', 'utf-8');
      const match = meminfo.match(/MemTotal:\s+(\d+)/);
      if (match) {
        diskInfo = { source: 'proc' };
      }
    } catch {
      // Disk info not available from /host/proc
    }

    res.json({
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: cpuUsage,
        loadAvg: os.loadavg(),
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        usagePercent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        arch: os.arch(),
      },
      disk: diskInfo,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get system info' });
  }
});

export default router;
