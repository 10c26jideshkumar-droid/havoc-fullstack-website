import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from './pool';
import { memoryStore } from './memoryStore';
import { AuthService } from '../services/authService';

export const seedMockData = async () => {
  console.log('Loading database backup & seeds into HAVOC...');

  const backupPath = path.join(__dirname, 'havoc_database_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.warn('Backup file not found at:', backupPath);
    return;
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const backup = JSON.parse(raw);
  const tables = backup.tables;

  const defaultPassword = 'Password123!';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
  const now = new Date().toISOString();

  // 1. Populate MemoryStore first
  // Users
  for (const u of tables.users) {
    memoryStore.users.set(u.id, {
      id: u.id,
      email: u.email,
      password_hash: defaultPasswordHash,
      role: u.role,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      company_name: u.company_name || null,
      created_at: u.created_at || now,
      updated_at: u.updated_at || now,
    });
  }

  // Creator Profiles
  for (const cp of tables.creator_profiles) {
    memoryStore.creatorProfiles.set(cp.user_id, {
      user_id: cp.user_id,
      slug: cp.slug || null,
      headline: cp.headline,
      bio: cp.bio || null,
      location: cp.location || null,
      hourly_rate: Number(cp.hourly_rate),
      rating: Number(cp.rating),
      verified: cp.verified || false,
      specializations: cp.specializations || [],
      languages: cp.languages || [],
      availability_status: cp.availability_status || 'available',
      created_at: now,
      updated_at: now,
    });
  }

  // Portfolios
  for (const p of tables.portfolios) {
    memoryStore.portfolios.set(p.id, {
      id: p.id,
      creator_id: p.creator_id,
      title: p.title,
      description: p.description || null,
      media_url: p.media_url,
      media_type: p.media_type || 'image',
      tags: p.tags || [],
      created_at: now,
      updated_at: now,
    });
  }

  // Reviews
  for (const r of tables.reviews) {
    memoryStore.reviews.set(r.id, {
      id: r.id,
      creator_id: r.creator_id,
      brand_name: r.brand_name,
      author_name: r.author_name,
      rating: Number(r.rating),
      review_text: r.review_text,
      review_date: r.review_date || null,
      created_at: now,
    });
  }

  // Packages
  for (const pkg of tables.packages) {
    memoryStore.packages.set(pkg.id, {
      id: pkg.id,
      creator_id: pkg.creator_id,
      name: pkg.name,
      price: Number(pkg.price),
      delivery_time: pkg.delivery_time || null,
      features: pkg.features || [],
      created_at: now,
    });
  }

  // Briefs
  for (const b of tables.briefs) {
    memoryStore.briefs.set(b.id, {
      id: b.id,
      brand_id: b.brand_id,
      title: b.title,
      description: b.description,
      required_specializations: b.required_specializations || [],
      budget_range: b.budget_range || null,
      max_budget: b.max_budget ? Number(b.max_budget) : null,
      status: b.status || 'open',
      created_at: b.created_at || now,
      updated_at: now,
    });
  }

  console.log(`Memory store populated with ${memoryStore.users.size} users, ${memoryStore.creatorProfiles.size} creators, ${memoryStore.portfolios.size} portfolios, ${memoryStore.briefs.size} briefs.`);

  // 2. If Postgres is reachable, apply seeds
  const isDb = await AuthService.testDb();
  if (isDb) {
    console.log('PostgreSQL connection detected. Applying SQL seeds...');
    const sqlPath = path.join(__dirname, 'havoc_database_schema_and_seeds.sql');
    if (fs.existsSync(sqlPath)) {
      try {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sqlContent);
        console.log('SQL schema & seeds executed on Postgres/Supabase successfully.');
      } catch (err) {
        console.error('Error executing SQL seed file on Postgres:', err);
      }
    }
  }
};

if (require.main === module) {
  seedMockData().then(() => {
    console.log('Seed execution completed.');
    process.exit(0);
  });
}
