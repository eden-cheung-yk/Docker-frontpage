import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getSetting } from './db/database.js';
import { startScanning } from './services/docker-scanner.js';
import { startMonitoring } from './services/uptime-monitor.js';
import settingsRouter from './routes/settings.js';
import layoutRouter from './routes/layout.js';
import dockerRouter from './routes/docker.js';
import widgetsRouter from './routes/widgets.js';
import todosRouter from './routes/todos.js';
import notesRouter from './routes/notes.js';
import uptimeRouter from './routes/uptime.js';
import speedtestRouter from './routes/speedtest.js';
import networkRouter from './routes/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

const startTime = new Date();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/system/info', (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const mins = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeStr = days > 0
    ? `${days}d ${hours}h ${mins}m`
    : hours > 0
      ? `${hours}h ${mins}m`
      : `${mins}m`;

  res.json({
    version: process.env.DOCKERDASH_VERSION || '1.0.0',
    buildDate: process.env.DOCKERDASH_BUILD_DATE || 'dev',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: uptimeStr,
    uptimeSeconds,
    startedAt: startTime.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    dataDir: process.env.DATA_DIR || './data',
    pid: process.pid,
    memoryUsage: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

app.use('/api/settings', settingsRouter);
app.use('/api/layout', layoutRouter);
app.use('/api/docker', dockerRouter);
app.use('/api/widgets', widgetsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/notes', notesRouter);
app.use('/api/uptime', uptimeRouter);
app.use('/api/speedtest', speedtestRouter);
app.use('/api/network', networkRouter);

if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', '..', 'public');
  app.use(express.static(publicPath));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

initDatabase();
console.log('Database initialized');

const scanInterval = parseInt(getSetting('dockerScanInterval') || '30', 10);
startScanning(scanInterval);

startMonitoring();

app.listen(PORT, () => {
  console.log(`DockerDash server running on http://localhost:${PORT}`);
});
