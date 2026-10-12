import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/pool';
import { CreatorService } from './creatorService';
import { Brief, SavedPick, InterviewInvite } from '../types';

export class ProjectService {
  public static async createBrief(brandId: string, data: {
    title: string; description: string; required_specializations: string[];
    budget_range?: string; max_budget?: number;
  }): Promise<Brief> {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO briefs (id, brand_id, title, description, required_specializations, budget_range, max_budget, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `).run(id, brandId, data.title, data.description, JSON.stringify(data.required_specializations),
      data.budget_range || null, data.max_budget || null, now, now);

    const row = db.prepare('SELECT * FROM briefs WHERE id = ?').get(id) as any;
    row.required_specializations = JSON.parse(row.required_specializations || '[]');
    return row;
  }

  public static async getBriefsByBrand(brandId: string) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM briefs WHERE brand_id = ? ORDER BY created_at DESC').all(brandId) as any[];
    return rows.map(r => ({ ...r, required_specializations: JSON.parse(r.required_specializations || '[]') }));
  }

  public static async getBriefById(briefId: string) {
    const db = getDb();
    const row = db.prepare(`
      SELECT b.*, u.full_name as brand_name, u.company_name 
      FROM briefs b JOIN users u ON b.brand_id = u.id 
      WHERE b.id = ?
    `).get(briefId) as any;
    if (!row) return null;
    row.required_specializations = JSON.parse(row.required_specializations || '[]');
    return row;
  }

  // --- Saved Picks ---

  public static async savePick(brandId: string, data: { creator_id: string; note?: string; notes?: string }) {
    const db = getDb();
    const id = uuidv4();
    const noteText = data.note || data.notes || null;

    db.prepare(`
      INSERT INTO saved_picks (id, brand_id, creator_id, note, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(brand_id, creator_id) DO UPDATE SET note = excluded.note
    `).run(id, brandId, data.creator_id, noteText);

    return db.prepare('SELECT * FROM saved_picks WHERE brand_id = ? AND creator_id = ?').get(brandId, data.creator_id);
  }

  public static async getSavedPicks(brandId: string) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT sp.*, cp.slug, cp.headline, cp.bio, cp.location, cp.hourly_rate, cp.rating,
             cp.verified, cp.specializations, cp.availability_status,
             u.full_name, u.avatar_url, u.email
      FROM saved_picks sp
      JOIN creator_profiles cp ON sp.creator_id = cp.user_id
      JOIN users u ON cp.user_id = u.id
      WHERE sp.brand_id = ?
      ORDER BY sp.created_at DESC
    `).all(brandId) as any[];

    return rows.map(row => ({
      id: row.id,
      brand_id: row.brand_id,
      creator_id: row.creator_id,
      note: row.note,
      created_at: row.created_at,
      creator: {
        id: row.creator_id,
        user_id: row.creator_id,
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
        availability_status: row.availability_status,
      },
    }));
  }

  // --- Interview Invites ---

  public static async sendInvite(brandId: string, data: { brief_id?: string; creator_id: string; message: string; proposed_date?: string }) {
    const db = getDb();
    const id = uuidv4();

    if (data.brief_id) {
      const brief = db.prepare('SELECT id FROM briefs WHERE id = ? AND brand_id = ?').get(data.brief_id, brandId);
      if (!brief) throw new Error('Brief not found or does not belong to you');
    }

    db.prepare(`
      INSERT INTO interview_invites (id, brand_id, creator_id, brief_id, message, proposed_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).run(id, brandId, data.creator_id, data.brief_id || null, data.message, data.proposed_date || null);

    return db.prepare('SELECT * FROM interview_invites WHERE id = ?').get(id);
  }
}
