import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../db/pool';

const router = Router();

// GET /api/portfolios - List portfolios with rich category, skill, creator, or type filters
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, skill, creator_id, media_type, q } = req.query as any;
    const db = getDb();

    let sql = `
      SELECT p.*, cp.slug as creator_slug, cp.rating as creator_rating, cp.hourly_rate as creator_hourly_rate, u.full_name as creator_name, u.avatar_url as creator_avatar
      FROM portfolios p
      JOIN creator_profiles cp ON p.creator_id = cp.user_id
      JOIN users u ON cp.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR u.full_name LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (creator_id) {
      sql += ` AND (p.creator_id = ? OR cp.slug = ?)`;
      params.push(creator_id, creator_id);
    }

    if (category) {
      sql += ` AND (p.tags LIKE ? OR cp.specializations LIKE ? OR cp.headline LIKE ?)`;
      const catTerm = `%${category}%`;
      params.push(catTerm, catTerm, catTerm);
    }

    if (skill) {
      sql += ` AND (p.tags LIKE ? OR cp.specializations LIKE ?)`;
      const skillTerm = `%${skill}%`;
      params.push(skillTerm, skillTerm);
    }

    if (media_type) {
      sql += ` AND p.media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const rows = db.prepare(sql).all(...params) as any[];
    const formatted = rows.map((r: any) => ({
      id: r.id,
      creator_id: r.creator_id,
      creator_slug: r.creator_slug,
      creator_name: r.creator_name,
      creator_avatar: r.creator_avatar,
      creator_rating: r.creator_rating,
      creator_hourly_rate: r.creator_hourly_rate,
      title: r.title,
      description: r.description,
      media_url: r.media_url,
      media_type: r.media_type,
      tags: JSON.parse(r.tags || '[]'),
      created_at: r.created_at,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/portfolios/:id - Single portfolio details
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT p.*, cp.slug as creator_slug, u.full_name as creator_name, u.avatar_url as creator_avatar
      FROM portfolios p
      JOIN creator_profiles cp ON p.creator_id = cp.user_id
      JOIN users u ON cp.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

    if (!row) {
      res.status(404).json({ success: false, error: 'Portfolio item not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: row.id,
        creator_id: row.creator_id,
        creator_slug: row.creator_slug,
        creator_name: row.creator_name,
        creator_avatar: row.creator_avatar,
        title: row.title,
        description: row.description,
        media_url: row.media_url,
        media_type: row.media_type,
        tags: JSON.parse(row.tags || '[]'),
        created_at: row.created_at,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
