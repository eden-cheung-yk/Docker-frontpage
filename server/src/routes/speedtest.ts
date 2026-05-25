import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import db from '../db/database.js';

const execAsync = promisify(exec);
const router = Router();

interface SpeedtestRow {
  id: string;
  timestamp: string;
  download: number;
  upload: number;
  ping: number;
}

router.post('/run', async (_req: Request, res: Response) => {
  try {
    const id = uuidv4();
    let download: number, upload: number, ping: number;

    try {
      const { stdout } = await execAsync('speedtest-cli --json', { timeout: 120000 });
      const result = JSON.parse(stdout) as { download: number; upload: number; ping: number };
      download = Math.round((result.download / 1_000_000) * 100) / 100;
      upload = Math.round((result.upload / 1_000_000) * 100) / 100;
      ping = Math.round(result.ping * 100) / 100;
    } catch {
      res.status(503).json({ error: 'speedtest-cli is not installed or not available. The Speed Test widget requires the speedtest-cli package.' });
      return;
    }

    db.prepare(
      'INSERT INTO speedtest_results (id, download, upload, ping) VALUES (?, ?, ?, ?)'
    ).run(id, download, upload, ping);

    const row = db.prepare('SELECT * FROM speedtest_results WHERE id = ?').get(id) as SpeedtestRow;
    res.json({
      id: row.id,
      timestamp: row.timestamp,
      download: row.download,
      upload: row.upload,
      ping: row.ping,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run speed test' });
  }
});

router.get('/results', (_req: Request, res: Response) => {
  try {
    const rows = db
      .prepare('SELECT * FROM speedtest_results ORDER BY timestamp DESC LIMIT 20')
      .all() as SpeedtestRow[];

    res.json(
      rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        download: row.download,
        upload: row.upload,
        ping: row.ping,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to get speed test results' });
  }
});

export default router;
