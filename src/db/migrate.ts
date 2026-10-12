import { getDb } from './pool';

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'creator' CHECK(role IN ('brand','creator','admin')),
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      company_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 2. Creator Profiles Table (user_id is PK and FK)
    CREATE TABLE IF NOT EXISTS creator_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT UNIQUE,
      headline TEXT NOT NULL,
      bio TEXT,
      location TEXT,
      hourly_rate REAL DEFAULT 0.00,
      rating REAL DEFAULT 5.00,
      verified INTEGER DEFAULT 0,
      specializations TEXT DEFAULT '[]',
      languages TEXT DEFAULT '[]',
      availability_status TEXT DEFAULT 'available' CHECK(availability_status IN ('available','busy','away')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 3. Portfolios
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      media_url TEXT NOT NULL,
      media_type TEXT DEFAULT 'image',
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 4. Creator Reviews
    CREATE TABLE IF NOT EXISTS creator_reviews (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
      brand_name TEXT NOT NULL,
      author_name TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 5.00,
      review_text TEXT NOT NULL,
      review_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 5. Creator Packages
    CREATE TABLE IF NOT EXISTS creator_packages (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      delivery_time TEXT,
      features TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 6. Briefs
    CREATE TABLE IF NOT EXISTS briefs (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_specializations TEXT DEFAULT '[]',
      budget_range TEXT,
      max_budget REAL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','matched','closed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 7. Matches
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      brief_id TEXT NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
      match_score REAL NOT NULL,
      match_explanation TEXT,
      matched_skills TEXT DEFAULT '[]',
      status TEXT DEFAULT 'suggested' CHECK(status IN ('suggested','saved_to_picks','interview_invited','accepted','rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(brief_id, creator_id)
    );

    -- 8. Saved Picks
    CREATE TABLE IF NOT EXISTS saved_picks (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(brand_id, creator_id)
    );

    -- 9. Interview Invites
    CREATE TABLE IF NOT EXISTS interview_invites (
      id TEXT PRIMARY KEY,
      brand_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      creator_id TEXT NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
      brief_id TEXT REFERENCES briefs(id) ON DELETE SET NULL,
      message TEXT,
      proposed_date TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_creator_slug ON creator_profiles(slug);
    CREATE INDEX IF NOT EXISTS idx_creator_rating ON creator_profiles(rating);
    CREATE INDEX IF NOT EXISTS idx_creator_rate ON creator_profiles(hourly_rate);
    CREATE INDEX IF NOT EXISTS idx_portfolios_creator ON portfolios(creator_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_creator ON creator_reviews(creator_id);
    CREATE INDEX IF NOT EXISTS idx_packages_creator ON creator_packages(creator_id);
    CREATE INDEX IF NOT EXISTS idx_briefs_brand ON briefs(brand_id);
    CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
    CREATE INDEX IF NOT EXISTS idx_matches_brief ON matches(brief_id);
    CREATE INDEX IF NOT EXISTS idx_matches_creator ON matches(creator_id);
    CREATE INDEX IF NOT EXISTS idx_picks_brand ON saved_picks(brand_id);
    CREATE INDEX IF NOT EXISTS idx_invites_brand ON interview_invites(brand_id);
    CREATE INDEX IF NOT EXISTS idx_invites_creator ON interview_invites(creator_id);
  `);

  console.log('SQLite schema created successfully.');
}

if (require.main === module) {
  runMigrations();
  console.log('Migration complete.');
  process.exit(0);
}
