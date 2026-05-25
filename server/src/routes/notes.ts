import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

const router = Router();

interface NoteRow {
  id: string;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all() as NoteRow[];
    const notes = rows.map((row) => ({
      id: row.id,
      content: row.content,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id as string) as NoteRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json({
      id: row.id,
      content: row.content,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get note' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { content, color } = req.body as { content?: string; color?: string };
    const id = uuidv4();

    db.prepare('INSERT INTO notes (id, content, color) VALUES (?, ?, ?)').run(
      id,
      content || '',
      color || '#fef08a'
    );

    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow;
    res.status(201).json({
      id: row.id,
      content: row.content,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const { content, color } = req.body as { content?: string; color?: string };

    db.prepare(
      "UPDATE notes SET content = ?, color = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(content ?? existing.content, color ?? existing.color, id);

    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow;
    res.json({
      id: row.id,
      content: row.content,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id as string);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
