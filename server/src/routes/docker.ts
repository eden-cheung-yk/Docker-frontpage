import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { getContainers } from '../services/docker-scanner.js';

const router = Router();

interface ManualService {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  group_name: string | null;
  description: string | null;
}

router.get('/containers', (_req: Request, res: Response) => {
  try {
    const dockerContainers = getContainers();
    const manualServices = db.prepare('SELECT * FROM services_manual').all() as ManualService[];

    const manual = manualServices.map((svc) => ({
      id: svc.id,
      name: svc.name,
      image: 'manual',
      status: 'Manual Service',
      state: 'manual',
      ports: [],
      labels: {},
      url: svc.url,
      icon: svc.icon,
      group: svc.group_name,
      description: svc.description,
      created: 0,
      isManual: true,
    }));

    res.json([...dockerContainers, ...manual]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get containers' });
  }
});

router.get('/container/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const containers = getContainers();
    const container = containers.find((c) => c.id === id);

    if (!container) {
      const manual = db.prepare('SELECT * FROM services_manual WHERE id = ?').get(id) as ManualService | undefined;
      if (manual) {
        res.json({
          id: manual.id,
          name: manual.name,
          url: manual.url,
          icon: manual.icon,
          group: manual.group_name,
          description: manual.description,
          isManual: true,
        });
        return;
      }
      res.status(404).json({ error: 'Container not found' });
      return;
    }

    res.json(container);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get container details' });
  }
});

router.post('/services', (req: Request, res: Response) => {
  try {
    const { name, url, icon, group_name, description } = req.body as {
      name: string;
      url: string;
      icon?: string;
      group_name?: string;
      description?: string;
    };

    if (!name || !url) {
      res.status(400).json({ error: 'Name and URL are required' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO services_manual (id, name, url, icon, group_name, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, url, icon || null, group_name || null, description || null);

    res.status(201).json({ id, name, url, icon: icon || null, group_name: group_name || null, description: description || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.put('/services/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, url, icon, group_name, description } = req.body as {
      name?: string;
      url?: string;
      icon?: string;
      group_name?: string;
      description?: string;
    };

    const existing = db.prepare('SELECT * FROM services_manual WHERE id = ?').get(id) as ManualService | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    db.prepare(
      'UPDATE services_manual SET name = ?, url = ?, icon = ?, group_name = ?, description = ? WHERE id = ?'
    ).run(
      name ?? existing.name,
      url ?? existing.url,
      icon ?? existing.icon,
      group_name ?? existing.group_name,
      description ?? existing.description,
      id
    );

    res.json({ id, name: name ?? existing.name, url: url ?? existing.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/services/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = db.prepare('DELETE FROM services_manual WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
