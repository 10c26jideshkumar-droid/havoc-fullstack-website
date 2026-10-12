import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './pool';
import { runMigrations } from './migrate';

export async function seedDatabase(): Promise<void> {
  // Ensure tables exist
  runMigrations();

  const db = getDb();
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Load backup data
  const backupPath = path.join(__dirname, 'havoc_database_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.warn('Backup file not found at:', backupPath);
    return;
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const backup = JSON.parse(raw);
  const tables = backup.tables;

  // Helper: JSON-encode arrays for SQLite TEXT columns
  const toJson = (arr: any[]) => JSON.stringify(arr || []);

  // Use a transaction for speed and atomicity
  const insertAll = db.transaction(() => {
    // -- Users --
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name, avatar_url, company_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of tables.users) {
      insertUser.run(
        u.id, u.email, passwordHash, u.role, u.full_name,
        u.avatar_url || null, u.company_name || null,
        u.created_at || new Date().toISOString(), u.updated_at || new Date().toISOString()
      );
    }

    // -- Creator Profiles --
    const insertCreator = db.prepare(`
      INSERT OR IGNORE INTO creator_profiles 
        (user_id, slug, headline, bio, location, hourly_rate, rating, verified, specializations, languages, availability_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const cp of tables.creator_profiles) {
      insertCreator.run(
        cp.user_id, cp.slug || null, cp.headline, cp.bio || null,
        cp.location || null, cp.hourly_rate, cp.rating,
        cp.verified ? 1 : 0,
        toJson(cp.specializations), toJson(cp.languages),
        cp.availability_status || 'available',
        new Date().toISOString(), new Date().toISOString()
      );
    }

    // -- Portfolios --
    const insertPortfolio = db.prepare(`
      INSERT OR IGNORE INTO portfolios (id, creator_id, title, description, media_url, media_type, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of tables.portfolios) {
      insertPortfolio.run(
        p.id, p.creator_id, p.title, p.description || null,
        p.media_url, p.media_type || 'image', toJson(p.tags),
        new Date().toISOString(), new Date().toISOString()
      );
    }

    // -- Reviews --
    const insertReview = db.prepare(`
      INSERT OR IGNORE INTO creator_reviews (id, creator_id, brand_name, author_name, rating, review_text, review_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of tables.reviews) {
      insertReview.run(
        r.id, r.creator_id, r.brand_name, r.author_name,
        r.rating, r.review_text, r.review_date || null,
        new Date().toISOString()
      );
    }

    // -- Packages --
    const insertPackage = db.prepare(`
      INSERT OR IGNORE INTO creator_packages (id, creator_id, name, price, delivery_time, features, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const pkg of tables.packages) {
      insertPackage.run(
        pkg.id, pkg.creator_id, pkg.name, pkg.price,
        pkg.delivery_time || null, toJson(pkg.features),
        new Date().toISOString()
      );
    }

    // -- Briefs --
    const insertBrief = db.prepare(`
      INSERT OR IGNORE INTO briefs (id, brand_id, title, description, required_specializations, budget_range, max_budget, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of tables.briefs) {
      insertBrief.run(
        b.id, b.brand_id, b.title, b.description,
        toJson(b.required_specializations), b.budget_range || null,
        b.max_budget || null, b.status || 'open',
        b.created_at || new Date().toISOString(), new Date().toISOString()
      );
    }
  });

  insertAll();

  // Verify
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const creatorCount = (db.prepare('SELECT COUNT(*) as count FROM creator_profiles').get() as any).count;
  const portfolioCount = (db.prepare('SELECT COUNT(*) as count FROM portfolios').get() as any).count;
  const briefCount = (db.prepare('SELECT COUNT(*) as count FROM briefs').get() as any).count;

  console.log(`SQLite seeded: ${userCount} users, ${creatorCount} creators, ${portfolioCount} portfolios, ${briefCount} briefs.`);
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seed complete.');
    process.exit(0);
  });
}
