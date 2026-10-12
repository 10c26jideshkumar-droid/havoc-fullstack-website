import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { memoryStore } from '../db/memoryStore';
import { AuthService } from './authService';
import { CreatorService } from './creatorService';
import { Brief, SavedPick, InterviewInvite } from '../types';

export class ProjectService {
  public static async createBrief(brandId: string, data: {
    title: string;
    description: string;
    required_specializations: string[];
    budget_range?: string;
    max_budget?: number;
  }): Promise<Brief> {
    const isDb = await AuthService.testDb();
    const briefId = uuidv4();
    const now = new Date().toISOString();

    if (isDb) {
      const res = await pool.query(
        `INSERT INTO briefs (id, brand_id, title, description, required_specializations, budget_range, max_budget, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NOW(), NOW())
         RETURNING *`,
        [briefId, brandId, data.title, data.description, data.required_specializations, data.budget_range || null, data.max_budget || null]
      );
      return res.rows[0];
    } else {
      const brief: Brief = {
        id: briefId,
        brand_id: brandId,
        title: data.title,
        description: data.description,
        required_specializations: data.required_specializations,
        budget_range: data.budget_range || null,
        max_budget: data.max_budget || null,
        status: 'open',
        created_at: now,
        updated_at: now,
      };
      memoryStore.briefs.set(briefId, brief);
      return brief;
    }
  }

  public static async getBriefsByBrand(brandId: string) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      const res = await pool.query('SELECT * FROM briefs WHERE brand_id = $1 ORDER BY created_at DESC', [brandId]);
      return res.rows;
    } else {
      return Array.from(memoryStore.briefs.values())
        .filter(b => b.brand_id === brandId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  public static async getBriefById(briefId: string) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      const res = await pool.query(
        `SELECT b.*, u.full_name as brand_name, u.company_name 
         FROM briefs b 
         JOIN users u ON b.brand_id = u.id 
         WHERE b.id::text = $1`,
        [briefId]
      );
      return res.rows[0] || null;
    } else {
      const brief = memoryStore.briefs.get(briefId);
      if (!brief) return null;
      const brand = memoryStore.users.get(brief.brand_id);
      return {
        ...brief,
        brand_name: brand?.full_name,
        company_name: brand?.company_name,
      };
    }
  }

  // --- Saved Picks ("My Picks") ---

  public static async savePick(brandId: string, data: { creator_id: string; note?: string; notes?: string }) {
    const isDb = await AuthService.testDb();
    const pickId = uuidv4();
    const noteText = data.note || data.notes || null;

    if (isDb) {
      const res = await pool.query(
        `INSERT INTO saved_picks (id, brand_id, creator_id, note, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (brand_id, creator_id)
         DO UPDATE SET note = EXCLUDED.note
         RETURNING *`,
        [pickId, brandId, data.creator_id, noteText]
      );
      return res.rows[0];
    } else {
      let existingPick: SavedPick | undefined;
      for (const p of memoryStore.savedPicks.values()) {
        if (p.brand_id === brandId && p.creator_id === data.creator_id) {
          existingPick = p;
          break;
        }
      }

      if (existingPick) {
        existingPick.note = noteText || existingPick.note;
        return existingPick;
      }

      const pick: SavedPick = {
        id: pickId,
        brand_id: brandId,
        creator_id: data.creator_id,
        note: noteText,
        created_at: new Date().toISOString(),
      };
      memoryStore.savedPicks.set(pickId, pick);
      return pick;
    }
  }

  public static async getSavedPicks(brandId: string) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      const res = await pool.query(
        `SELECT 
           sp.*,
           cp.slug, cp.headline, cp.bio, cp.location, cp.hourly_rate, cp.rating, cp.verified, cp.specializations, cp.availability_status,
           u.full_name, u.avatar_url, u.email
         FROM saved_picks sp
         JOIN creator_profiles cp ON sp.creator_id = cp.user_id
         JOIN users u ON cp.user_id = u.id
         WHERE sp.brand_id = $1
         ORDER BY sp.created_at DESC`,
        [brandId]
      );

      return res.rows.map(row => ({
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
          hourly_rate: parseFloat(row.hourly_rate),
          rating: parseFloat(row.rating),
          verified: row.verified,
          specializations: row.specializations || [],
          availability_status: row.availability_status,
        },
      }));
    } else {
      const picks = Array.from(memoryStore.savedPicks.values()).filter(p => p.brand_id === brandId);
      const results = [];

      for (const pick of picks) {
        try {
          const creator = await CreatorService.getCreatorById(pick.creator_id);
          results.push({
            ...pick,
            creator,
          });
        } catch {
          // ignore orphan pick
        }
      }
      return results;
    }
  }

  // --- Interview Invites ---

  public static async sendInvite(brandId: string, data: { brief_id?: string; creator_id: string; message: string; proposed_date?: string }) {
    const isDb = await AuthService.testDb();
    const inviteId = uuidv4();

    if (isDb) {
      if (data.brief_id) {
        const briefRes = await pool.query('SELECT id FROM briefs WHERE id::text = $1 AND brand_id = $2', [data.brief_id, brandId]);
        if (briefRes.rows.length === 0) {
          throw new Error('Brief not found or does not belong to you');
        }
      }

      const res = await pool.query(
        `INSERT INTO interview_invites (id, brand_id, creator_id, brief_id, message, proposed_date, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
         RETURNING *`,
        [inviteId, brandId, data.creator_id, data.brief_id || null, data.message, data.proposed_date ? new Date(data.proposed_date) : null]
      );
      return res.rows[0];
    } else {
      if (data.brief_id) {
        const brief = memoryStore.briefs.get(data.brief_id);
        if (!brief || brief.brand_id !== brandId) {
          throw new Error('Brief not found or does not belong to you');
        }
      }

      const invite: InterviewInvite = {
        id: inviteId,
        brand_id: brandId,
        creator_id: data.creator_id,
        brief_id: data.brief_id || null,
        message: data.message,
        proposed_date: data.proposed_date || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryStore.interviewInvites.set(inviteId, invite);
      return invite;
    }
  }
}
