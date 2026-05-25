import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

const router = Router();

interface TodoRow {
  id: string;
  text: string;
  completed: number;
  priority: string;
  due_date: string | null;
  sort_order: number;
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM todos ORDER BY sort_order ASC, rowid ASC').all() as TodoRow[];
    const todos = rows.map((row) => ({
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      priority: row.priority,
      dueDate: row.due_date,
      sortOrder: row.sort_order,
    }));
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get todos' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id as string) as TodoRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json({
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      priority: row.priority,
      dueDate: row.due_date,
      sortOrder: row.sort_order,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get todo' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { text, priority, dueDate, sortOrder } = req.body as {
      text: string;
      priority?: string;
      dueDate?: string;
      sortOrder?: number;
    };

    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO todos (id, text, completed, priority, due_date, sort_order) VALUES (?, ?, 0, ?, ?, ?)'
    ).run(id, text, priority || 'medium', dueDate || null, sortOrder ?? 0);

    res.status(201).json({ id, text, completed: false, priority: priority || 'medium', dueDate: dueDate || null, sortOrder: sortOrder ?? 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as TodoRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    const { text, completed, priority, dueDate, sortOrder } = req.body as {
      text?: string;
      completed?: boolean;
      priority?: string;
      dueDate?: string | null;
      sortOrder?: number;
    };

    db.prepare(
      'UPDATE todos SET text = ?, completed = ?, priority = ?, due_date = ?, sort_order = ? WHERE id = ?'
    ).run(
      text ?? existing.text,
      completed !== undefined ? (completed ? 1 : 0) : existing.completed,
      priority ?? existing.priority,
      dueDate !== undefined ? dueDate : existing.due_date,
      sortOrder ?? existing.sort_order,
      id
    );

    res.json({ id, text: text ?? existing.text, completed: completed ?? existing.completed === 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id as string);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
