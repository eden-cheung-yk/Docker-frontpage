import { Router, Request, Response } from 'express';
import db, { getAllSettings, setSetting } from '../db/database.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const settings = getAllSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      setSetting(key, String(value));
    }
    res.json(getAllSettings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/export', (_req: Request, res: Response) => {
  try {
    const settings = getAllSettings();
    const layout = db.prepare('SELECT * FROM layout').all();
    const services = db.prepare('SELECT * FROM services_manual').all();
    const bookmarks = db.prepare('SELECT * FROM bookmarks').all();

    res.json({ settings, layout, services, bookmarks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export config' });
  }
});

router.post('/import', (req: Request, res: Response) => {
  try {
    const { settings, layout, services, bookmarks } = req.body as {
      settings?: Record<string, string>;
      layout?: { instance_id: string; widget_type: string; x: number; y: number; w: number; h: number; settings: string }[];
      services?: { id: string; name: string; url: string; icon?: string; group_name?: string; description?: string }[];
      bookmarks?: { id: string; name: string; url: string; icon?: string; group_name?: string; sort_order?: number }[];
    };

    const importTx = db.transaction(() => {
      if (settings) {
        db.prepare('DELETE FROM settings').run();
        const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        for (const [key, value] of Object.entries(settings)) {
          insert.run(key, String(value));
        }
      }

      if (layout) {
        db.prepare('DELETE FROM layout').run();
        const insert = db.prepare(
          'INSERT INTO layout (instance_id, widget_type, x, y, w, h, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        for (const item of layout) {
          insert.run(item.instance_id, item.widget_type, item.x, item.y, item.w, item.h, item.settings || '{}');
        }
      }

      if (services) {
        db.prepare('DELETE FROM services_manual').run();
        const insert = db.prepare(
          'INSERT INTO services_manual (id, name, url, icon, group_name, description) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const svc of services) {
          insert.run(svc.id, svc.name, svc.url, svc.icon || null, svc.group_name || null, svc.description || null);
        }
      }

      if (bookmarks) {
        db.prepare('DELETE FROM bookmarks').run();
        const insert = db.prepare(
          'INSERT INTO bookmarks (id, name, url, icon, group_name, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const bm of bookmarks) {
          insert.run(bm.id, bm.name, bm.url, bm.icon || null, bm.group_name || 'General', bm.sort_order || 0);
        }
      }
    });

    importTx();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import config' });
  }
});

export default router;
