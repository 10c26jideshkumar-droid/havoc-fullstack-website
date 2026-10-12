import { pool } from '../db/pool';
import { memoryStore } from '../db/memoryStore';
import { AuthService } from './authService';
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

export class CreatorService {
  public static async listCreators(filters: CreatorFilterParams) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      let queryText = `
        SELECT 
          cp.user_id as id, cp.user_id, cp.slug, cp.headline, cp.bio, cp.location, 
          cp.hourly_rate, cp.rating, cp.verified, cp.specializations, cp.languages, cp.availability_status, 
          cp.created_at, cp.updated_at,
          u.full_name, u.avatar_url, u.email
        FROM creator_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE 1=1
      `;
      const queryParams: any[] = [];
      let paramIndex = 1;

      if (filters.q) {
        queryText += ` AND (
          u.full_name ILIKE $${paramIndex} OR 
          cp.headline ILIKE $${paramIndex} OR 
          cp.bio ILIKE $${paramIndex} OR
          $${paramIndex} = ANY(cp.specializations)
        )`;
        queryParams.push(`%${filters.q}%`);
        paramIndex++;
      }

      if (filters.specialization) {
        queryText += ` AND $${paramIndex} = ANY(cp.specializations)`;
        queryParams.push(filters.specialization);
        paramIndex++;
      }

      if (filters.location) {
        queryText += ` AND cp.location ILIKE $${paramIndex}`;
        queryParams.push(`%${filters.location}%`);
        paramIndex++;
      }

      if (filters.min_rate !== undefined) {
        queryText += ` AND cp.hourly_rate >= $${paramIndex}`;
        queryParams.push(filters.min_rate);
        paramIndex++;
      }

      if (filters.max_rate !== undefined) {
        queryText += ` AND cp.hourly_rate <= $${paramIndex}`;
        queryParams.push(filters.max_rate);
        paramIndex++;
      }

      if (filters.availability) {
        queryText += ` AND cp.availability_status = $${paramIndex}`;
        queryParams.push(filters.availability);
        paramIndex++;
      }

      // Sort
      switch (filters.sort_by) {
        case 'hourly_rate_asc':
          queryText += ` ORDER BY cp.hourly_rate ASC`;
          break;
        case 'hourly_rate_desc':
          queryText += ` ORDER BY cp.hourly_rate DESC`;
          break;
        case 'newest':
          queryText += ` ORDER BY cp.created_at DESC`;
          break;
        case 'rating':
        default:
          queryText += ` ORDER BY cp.rating DESC`;
          break;
      }

      const res = await pool.query(queryText, queryParams);
      return res.rows.map(row => ({
        id: row.user_id,
        user_id: row.user_id,
        slug: row.slug,
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
        languages: row.languages || [],
        availability_status: row.availability_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } else {
      let creators = Array.from(memoryStore.creatorProfiles.values()).map(cp => {
        const u = memoryStore.users.get(cp.user_id);
        return {
          id: cp.user_id,
          user_id: cp.user_id,
          slug: cp.slug,
          full_name: u?.full_name || 'Creator',
          avatar_url: u?.avatar_url || null,
          email: u?.email || '',
          headline: cp.headline,
          bio: cp.bio,
          location: cp.location,
          hourly_rate: Number(cp.hourly_rate),
          rating: Number(cp.rating),
          verified: cp.verified || false,
          specializations: cp.specializations || [],
          languages: cp.languages || [],
          availability_status: cp.availability_status,
          created_at: cp.created_at,
          updated_at: cp.updated_at,
        };
      });

      if (filters.q) {
        const q = filters.q.toLowerCase();
        creators = creators.filter(c =>
          c.full_name.toLowerCase().includes(q) ||
          c.headline.toLowerCase().includes(q) ||
          (c.bio && c.bio.toLowerCase().includes(q)) ||
          c.specializations.some(s => s.toLowerCase().includes(q))
        );
      }

      if (filters.specialization) {
        const spec = filters.specialization.toLowerCase();
        creators = creators.filter(c =>
          c.specializations.some(s => s.toLowerCase() === spec)
        );
      }

      if (filters.location) {
        const loc = filters.location.toLowerCase();
        creators = creators.filter(c => c.location && c.location.toLowerCase().includes(loc));
      }

      if (filters.min_rate !== undefined) {
        creators = creators.filter(c => c.hourly_rate >= (filters.min_rate ?? 0));
      }

      if (filters.max_rate !== undefined) {
        creators = creators.filter(c => c.hourly_rate <= (filters.max_rate ?? Infinity));
      }

      if (filters.availability) {
        creators = creators.filter(c => c.availability_status === filters.availability);
      }

      if (filters.sort_by === 'hourly_rate_asc') {
        creators.sort((a, b) => a.hourly_rate - b.hourly_rate);
      } else if (filters.sort_by === 'hourly_rate_desc') {
        creators.sort((a, b) => b.hourly_rate - a.hourly_rate);
      } else if (filters.sort_by === 'newest') {
        creators.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        creators.sort((a, b) => b.rating - a.rating);
      }

      return creators;
    }
  }

  public static async getCreatorById(idOrSlug: string) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      const creatorRes = await pool.query(
        `SELECT cp.*, u.full_name, u.avatar_url, u.email
         FROM creator_profiles cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.user_id::text = $1 OR cp.slug = $1`,
        [idOrSlug]
      );

      if (creatorRes.rows.length === 0) {
        throw new Error('Creator profile not found');
      }

      const creator = creatorRes.rows[0];

      // Fetch Portfolios
      const portfoliosRes = await pool.query(
        'SELECT * FROM portfolios WHERE creator_id = $1 ORDER BY created_at DESC',
        [creator.user_id]
      );

      // Fetch Reviews
      const reviewsRes = await pool.query(
        'SELECT * FROM creator_reviews WHERE creator_id = $1 ORDER BY created_at DESC',
        [creator.user_id]
      );

      // Fetch Packages
      const packagesRes = await pool.query(
        'SELECT * FROM creator_packages WHERE creator_id = $1 ORDER BY price ASC',
        [creator.user_id]
      );

      return {
        ...creator,
        id: creator.user_id,
        hourly_rate: parseFloat(creator.hourly_rate),
        rating: parseFloat(creator.rating),
        portfolios: portfoliosRes.rows,
        reviews: reviewsRes.rows,
        packages: packagesRes.rows,
      };
    } else {
      let creator: CreatorProfile | undefined;
      for (const cp of memoryStore.creatorProfiles.values()) {
        if (cp.user_id === idOrSlug || cp.slug === idOrSlug) {
          creator = cp;
          break;
        }
      }

      if (!creator) {
        throw new Error('Creator profile not found');
      }

      const user = memoryStore.users.get(creator.user_id);
      const portfolios = Array.from(memoryStore.portfolios.values()).filter(p => p.creator_id === creator!.user_id);
      const reviews = Array.from(memoryStore.reviews.values()).filter(r => r.creator_id === creator!.user_id);
      const packages = Array.from(memoryStore.packages.values()).filter(pkg => pkg.creator_id === creator!.user_id);

      return {
        ...creator,
        id: creator.user_id,
        full_name: user?.full_name || 'Creator',
        avatar_url: user?.avatar_url || null,
        email: user?.email || '',
        portfolios,
        reviews,
        packages,
      };
    }
  }

  public static async updateProfile(userId: string, updates: Partial<CreatorProfile>) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      const existing = await pool.query('SELECT user_id FROM creator_profiles WHERE user_id = $1', [userId]);
      if (existing.rows.length === 0) {
        throw new Error('Creator profile not found for this user');
      }

      const fields: string[] = [];
      const values: any[] = [];
      let index = 1;

      if (updates.headline !== undefined) {
        fields.push(`headline = $${index++}`);
        values.push(updates.headline);
      }
      if (updates.bio !== undefined) {
        fields.push(`bio = $${index++}`);
        values.push(updates.bio);
      }
      if (updates.location !== undefined) {
        fields.push(`location = $${index++}`);
        values.push(updates.location);
      }
      if (updates.hourly_rate !== undefined) {
        fields.push(`hourly_rate = $${index++}`);
        values.push(updates.hourly_rate);
      }
      if (updates.specializations !== undefined) {
        fields.push(`specializations = $${index++}`);
        values.push(updates.specializations);
      }
      if (updates.languages !== undefined) {
        fields.push(`languages = $${index++}`);
        values.push(updates.languages);
      }
      if (updates.availability_status !== undefined) {
        fields.push(`availability_status = $${index++}`);
        values.push(updates.availability_status);
      }

      fields.push(`updated_at = NOW()`);
      values.push(userId);

      const q = `
        UPDATE creator_profiles
        SET ${fields.join(', ')}
        WHERE user_id = $${index}
        RETURNING *
      `;

      const res = await pool.query(q, values);
      return res.rows[0];
    } else {
      const creator = memoryStore.creatorProfiles.get(userId);
      if (!creator) {
        throw new Error('Creator profile not found for this user');
      }

      const updated = {
        ...creator,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      memoryStore.creatorProfiles.set(userId, updated);
      return updated;
    }
  }

  public static async addPortfolio(creatorUserId: string, data: { title: string; description?: string; media_url: string; media_type?: string; tags?: string[] }) {
    const isDb = await AuthService.testDb();

    if (isDb) {
      const res = await pool.query(
        `INSERT INTO portfolios (creator_id, title, description, media_url, media_type, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [creatorUserId, data.title, data.description || null, data.media_url, data.media_type || 'image', data.tags || []]
      );
      return res.rows[0];
    } else {
      const portfolioId = 'p-' + Date.now();
      const portfolio = {
        id: portfolioId,
        creator_id: creatorUserId,
        title: data.title,
        description: data.description || null,
        media_url: data.media_url,
        media_type: data.media_type || 'image',
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryStore.portfolios.set(portfolioId, portfolio);
      return portfolio;
    }
  }
}
