import { getDb } from '../db/pool';
import { Brand } from '../types';

export interface BrandFilterParams {
  q?: string;
  industry?: string;
  location?: string;
  category?: string;
}

function parseBrandRow(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    logo_url: row.logo_url,
    industry: row.industry,
    description: row.description,
    location: row.location,
    website: row.website,
    founded: row.founded,
    team_size: row.team_size,
    campaign_requirements: JSON.parse(row.campaign_requirements || '[]'),
    budget_range: row.budget_range,
    preferred_categories: JSON.parse(row.preferred_categories || '[]'),
    contact_email: row.contact_email,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class BrandService {
  public static async listBrands(filters?: BrandFilterParams): Promise<Brand[]> {
    const db = getDb();
    let sql = `SELECT * FROM brands WHERE 1=1`;
    const params: any[] = [];

    if (filters?.q) {
      sql += ` AND (name LIKE ? OR industry LIKE ? OR description LIKE ? OR location LIKE ?)`;
      const term = `%${filters.q}%`;
      params.push(term, term, term, term);
    }

    if (filters?.industry) {
      sql += ` AND industry LIKE ?`;
      params.push(`%${filters.industry}%`);
    }

    if (filters?.location) {
      sql += ` AND location LIKE ?`;
      params.push(`%${filters.location}%`);
    }

    if (filters?.category) {
      sql += ` AND preferred_categories LIKE ?`;
      params.push(`%${filters.category}%`);
    }

    sql += ` ORDER BY name ASC`;

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(parseBrandRow);
  }

  public static async getBrandById(id: string): Promise<Brand | null> {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM brands WHERE id = ? OR name LIKE ?`).get(id, `%${id}%`) as any;
    if (!row) return null;
    return parseBrandRow(row);
  }

  public static async createBrand(data: Partial<Brand>): Promise<Brand> {
    const db = getDb();
    const { v4: uuidv4 } = require('uuid');
    const id = data.id || uuidv4();

    db.prepare(`
      INSERT INTO brands (id, name, logo_url, industry, description, location, website, founded, team_size, campaign_requirements, budget_range, preferred_categories, contact_email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id,
      data.name,
      data.logo_url || null,
      data.industry || 'General',
      data.description || '',
      data.location || 'Remote',
      data.website || null,
      data.founded || null,
      data.team_size || null,
      JSON.stringify(data.campaign_requirements || []),
      data.budget_range || null,
      JSON.stringify(data.preferred_categories || []),
      data.contact_email || null
    );

    return (await this.getBrandById(id))!;
  }
}
