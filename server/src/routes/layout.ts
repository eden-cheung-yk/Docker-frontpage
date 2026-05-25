import { Router, Request, Response } from 'express';
import db, { seedDefaultLayout } from '../db/database.js';

const router = Router();

interface LayoutRow {
  instance_id: string;
  widget_type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: string;
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM layout').all() as LayoutRow[];
    const items = rows.map((row) => ({
      instanceId: row.instance_id,
      widgetType: row.widget_type,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
      settings: JSON.parse(row.settings || '{}'),
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get layout' });
  }
});

router.put('/', (req: Request, res: Response) => {
  try {
    const items = req.body as {
      instanceId: string;
      widgetType: string;
      x: number;
      y: number;
      w: number;
      h: number;
      settings?: Record<string, unknown>;
    }[];

    const replaceTx = db.transaction(() => {
      db.prepare('DELETE FROM layout').run();
      const insert = db.prepare(
        'INSERT INTO layout (instance_id, widget_type, x, y, w, h, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const item of items) {
        insert.run(
          item.instanceId,
          item.widgetType,
          item.x,
          item.y,
          item.w,
          item.h,
          JSON.stringify(item.settings || {})
        );
      }
    });

    replaceTx();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update layout' });
  }
});

router.post('/reset', (_req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM layout').run();
    seedDefaultLayout();

    const rows = db.prepare('SELECT * FROM layout').all() as LayoutRow[];
    const items = rows.map((row) => ({
      instanceId: row.instance_id,
      widgetType: row.widget_type,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
      settings: JSON.parse(row.settings || '{}'),
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset layout' });
  }
});

export default router;
