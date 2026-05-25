import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { getStatus, getHistory, refreshTarget, removeTarget } from '../services/uptime-monitor.js';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  try {
    const status = getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get uptime status' });
  }
});

router.get('/history/:targetId', (req: Request, res: Response) => {
  try {
    const targetId = req.params.targetId as string;
    const history = getHistory(targetId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get uptime history' });
  }
});

router.post('/targets', (req: Request, res: Response) => {
  try {
    const { name, url, check_interval, timeout } = req.body as {
      name: string;
      url: string;
      check_interval?: number;
      timeout?: number;
    };

    if (!name || !url) {
      res.status(400).json({ error: 'Name and URL are required' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO uptime_targets (id, name, url, check_interval, timeout) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, url, check_interval || 60, timeout || 5000);

    refreshTarget(id);
    res.status(201).json({ id, name, url, check_interval: check_interval || 60, timeout: timeout || 5000 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create uptime target' });
  }
});

router.put('/targets/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    interface TargetRow {
      id: string;
      name: string;
      url: string;
      check_interval: number;
      timeout: number;
    }

    const existing = db.prepare('SELECT * FROM uptime_targets WHERE id = ?').get(id) as TargetRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Target not found' });
      return;
    }

    const { name, url, check_interval, timeout } = req.body as {
      name?: string;
      url?: string;
      check_interval?: number;
      timeout?: number;
    };

    db.prepare(
      'UPDATE uptime_targets SET name = ?, url = ?, check_interval = ?, timeout = ? WHERE id = ?'
    ).run(
      name ?? existing.name,
      url ?? existing.url,
      check_interval ?? existing.check_interval,
      timeout ?? existing.timeout,
      id
    );

    refreshTarget(id);
    res.json({ id, name: name ?? existing.name, url: url ?? existing.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update target' });
  }
});

router.delete('/targets/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    removeTarget(id);

    db.prepare('DELETE FROM uptime_history WHERE target_id = ?').run(id);
    const result = db.prepare('DELETE FROM uptime_targets WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Target not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete target' });
  }
});

export default router;
