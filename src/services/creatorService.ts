import { getDb } from '../db/pool';
import { CreatorProfile } from '../types';

export interface CreatorFilterParams {
  q?: string;
  specialization?: string;
  location?: string;
  min_rate?: number;
  max_rate?: number;
  sort_by?: 'rating' | 'hourly_rate_asc' | 'hourly_rate_desc' | 'newest';
  availability?: 'available' | 'busy' | 'away';
}

function parseCreatorRow(row: any) {
  return {
    id: row.user_id,
    user_id: row.user_id,
    slug: row.slug,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    email: row.email,
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    hourly_rate: row.hourly_rate,
    rating: row.rating,
    verified: !!row.verified,
    specializations: JSON.parse(row.specializations || '[]'),
    languages: JSON.parse(row.languages || '[]'),
    availability_status: row.availability_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class CreatorService {
  public static async listCreators(filters: CreatorFilterParams) {
    const db = getDb();
    let sql = `
      SELECT cp.*, u.full_name, u.avatar_url, u.email
      FROM creator_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.q) {
      sql += ` AND (u.full_name LIKE ? OR cp.headline LIKE ? OR cp.bio LIKE ? OR cp.specializations LIKE ?)`;
      const q = `%${filters.q}%`;
      params.push(q, q, q, q);
    }

    if (filters.specialization) {
      sql += ` AND cp.specializations LIKE ?`;
      params.push(`%${filters.specialization}%`);
    }

    if (filters.location) {
      sql += ` AND cp.location LIKE ?`;
      params.push(`%${filters.location}%`);
    }

    if (filters.min_rate !== undefined) {
      sql += ` AND cp.hourly_rate >= ?`;
      params.push(filters.min_rate);
    }

    if (filters.max_rate !== undefined) {
      sql += ` AND cp.hourly_rate <= ?`;
      params.push(filters.max_rate);
    }

    if (filters.availability) {
      sql += ` AND cp.availability_status = ?`;
      params.push(filters.availability);
    }

    switch (filters.sort_by) {
      case 'hourly_rate_asc':
        sql += ` ORDER BY cp.hourly_rate ASC`;
        break;
      case 'hourly_rate_desc':
        sql += ` ORDER BY cp.hourly_rate DESC`;
        break;
      case 'newest':
        sql += ` ORDER BY cp.created_at DESC`;
        break;
      case 'rating':
      default:
        sql += ` ORDER BY cp.rating DESC`;
        break;
    }

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(parseCreatorRow);
  }

  public static async getCreatorById(idOrSlug: string) {
    const db = getDb();

    const creator = db.prepare(`
      SELECT cp.*, u.full_name, u.avatar_url, u.email
      FROM creator_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.user_id = ? OR cp.slug = ?
    `).get(idOrSlug, idOrSlug) as any;

    if (!creator) {
      throw new Error('Creator profile not found');
    }

    const portfolios = db.prepare('SELECT * FROM portfolios WHERE creator_id = ? ORDER BY created_at DESC')
      .all(creator.user_id) as any[];
    
    const reviews = db.prepare('SELECT * FROM creator_reviews WHERE creator_id = ? ORDER BY created_at DESC')
      .all(creator.user_id) as any[];

    const packages = db.prepare('SELECT * FROM creator_packages WHERE creator_id = ? ORDER BY price ASC')
      .all(creator.user_id) as any[];

    return {
      ...parseCreatorRow(creator),
      portfolios: portfolios.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') })),
      reviews,
      packages: packages.map(pkg => ({ ...pkg, features: JSON.parse(pkg.features || '[]') })),
    };
  }

  public static async updateProfile(userId: string, updates: Partial<CreatorProfile>) {
    const db = getDb();

    const existing = db.prepare('SELECT user_id FROM creator_profiles WHERE user_id = ?').get(userId);
    if (!existing) {
      throw new Error('Creator profile not found for this user');
    }

    const sets: string[] = [];
    const values: any[] = [];

    if (updates.headline !== undefined) { sets.push('headline = ?'); values.push(updates.headline); }
    if (updates.bio !== undefined) { sets.push('bio = ?'); values.push(updates.bio); }
    if (updates.location !== undefined) { sets.push('location = ?'); values.push(updates.location); }
    if (updates.hourly_rate !== undefined) { sets.push('hourly_rate = ?'); values.push(updates.hourly_rate); }
    if (updates.specializations !== undefined) { sets.push('specializations = ?'); values.push(JSON.stringify(updates.specializations)); }
    if (updates.languages !== undefined) { sets.push('languages = ?'); values.push(JSON.stringify(updates.languages)); }
    if (updates.availability_status !== undefined) { sets.push('availability_status = ?'); values.push(updates.availability_status); }

    sets.push("updated_at = datetime('now')");
    values.push(userId);

    db.prepare(`UPDATE creator_profiles SET ${sets.join(', ')} WHERE user_id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM creator_profiles WHERE user_id = ?').get(userId) as any;
    updated.specializations = JSON.parse(updated.specializations || '[]');
    updated.languages = JSON.parse(updated.languages || '[]');
    updated.verified = !!updated.verified;
    return updated;
  }

  public static async addPortfolio(
    creatorUserId: string, 
    data: { 
      title: string; 
      description?: string; 
      media_url: string; 
      media_type?: string; 
      tags?: string[];
      thumbnail_url?: string;
      project_url?: string;
      file_size?: number;
      mime_type?: string;
      visibility?: string;
    }
  ) {
    const db = getDb();
    const id = require('uuid').v4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO portfolios (
        id, creator_id, title, description, media_url, media_type, tags, 
        thumbnail_url, project_url, file_size, mime_type, visibility, 
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      creatorUserId, 
      data.title, 
      data.description || null, 
      data.media_url, 
      data.media_type || 'image', 
      JSON.stringify(data.tags || []),
      data.thumbnail_url || null,
      data.project_url || null,
      data.file_size || 0,
      data.mime_type || null,
      data.visibility || 'public',
      now, 
      now
    );

    const row = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(id) as any;
    row.tags = JSON.parse(row.tags || '[]');
    return row;
  }

  public static async updatePortfolio(
    portfolioId: string, 
    creatorUserId: string, 
    data: Partial<{
      title: string;
      description: string;
      media_url: string;
      media_type: string;
      tags: string[];
      thumbnail_url: string;
      project_url: string;
      visibility: string;
    }>
  ) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(portfolioId) as any;
    if (!existing) {
      throw new Error('Portfolio item not found');
    }
    if (existing.creator_id !== creatorUserId) {
      throw new Error('Unauthorized to modify this portfolio item');
    }

    const sets: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
    if (data.media_url !== undefined) { sets.push('media_url = ?'); values.push(data.media_url); }
    if (data.media_type !== undefined) { sets.push('media_type = ?'); values.push(data.media_type); }
    if (data.tags !== undefined) { sets.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
    if (data.thumbnail_url !== undefined) { sets.push('thumbnail_url = ?'); values.push(data.thumbnail_url); }
    if (data.project_url !== undefined) { sets.push('project_url = ?'); values.push(data.project_url); }
    if (data.visibility !== undefined) { sets.push('visibility = ?'); values.push(data.visibility); }

    sets.push("updated_at = datetime('now')");
    values.push(portfolioId);

    db.prepare(`UPDATE portfolios SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(portfolioId) as any;
    updated.tags = JSON.parse(updated.tags || '[]');
    return updated;
  }

  public static async deletePortfolio(portfolioId: string, creatorUserId: string) {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM portfolios WHERE id = ?').get(portfolioId) as any;
    if (!existing) {
      throw new Error('Portfolio item not found');
    }
    if (existing.creator_id !== creatorUserId) {
      throw new Error('Unauthorized to delete this portfolio item');
    }
    db.prepare('DELETE FROM portfolios WHERE id = ?').run(portfolioId);
    return { success: true, message: 'Portfolio item deleted successfully' };
  }
}
