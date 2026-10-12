-- ==============================================================================
-- HAVOC Platform Database Schema (PostgreSQL / Supabase)
-- AI-native Creator Marketplace Schema
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pgvector if available (Supabase supports vector extension)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Clean existing types (if re-running in development)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('brand', 'creator', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
        CREATE TYPE availability_status AS ENUM ('available', 'busy', 'away');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'brief_status') THEN
        CREATE TYPE brief_status AS ENUM ('open', 'matched', 'closed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
        CREATE TYPE match_status AS ENUM ('suggested', 'saved_to_picks', 'interview_invited', 'accepted', 'rejected');
    END IF;
END $$;

-- 1. Users / Profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'creator',
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Creator Profiles (Extension for users with role = 'creator')
CREATE TABLE IF NOT EXISTS creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255) NOT NULL,
    bio TEXT,
    location VARCHAR(255),
    hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    specializations TEXT[] NOT NULL DEFAULT '{}',
    availability_status availability_status NOT NULL DEFAULT 'available',
    completed_projects INT NOT NULL DEFAULT 0,
    response_time VARCHAR(100) DEFAULT '< 2 hours',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search and filtering indexes for creator discovery
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_hourly_rate ON creator_profiles(hourly_rate);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_rating ON creator_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_availability ON creator_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_specializations ON creator_profiles USING GIN (specializations);

-- 3. Portfolios / Showcase Projects
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolios_creator_id ON portfolios(creator_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_tags ON portfolios USING GIN (tags);

-- 4. Briefs / Projects (Created by Brands)
CREATE TABLE IF NOT EXISTS briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_specializations TEXT[] NOT NULL DEFAULT '{}',
    budget_range VARCHAR(100),
    status brief_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_required_specializations ON briefs USING GIN (required_specializations);

-- 5. Matches & Invites
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    match_explanation TEXT,
    status match_status NOT NULL DEFAULT 'suggested',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brief_creator_match UNIQUE (brief_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_brief_id ON matches(brief_id);
CREATE INDEX IF NOT EXISTS idx_matches_creator_id ON matches(creator_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- 6. Saved Creator Picks ("My Picks" by brands)
CREATE TABLE IF NOT EXISTS brand_saved_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_brand_creator_pick UNIQUE (brand_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_picks_brand_id ON brand_saved_picks(brand_id);
CREATE INDEX IF NOT EXISTS idx_saved_picks_creator_id ON brand_saved_picks(creator_id);

-- 7. Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_creator_id ON reviews(creator_id);

-- Automated Timestamp Update Trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_update ON users;
CREATE TRIGGER trg_users_update BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trg_creator_profiles_update ON creator_profiles;
CREATE TRIGGER trg_creator_profiles_update BEFORE UPDATE ON creator_profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trg_portfolios_update ON portfolios;
CREATE TRIGGER trg_portfolios_update BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trg_briefs_update ON briefs;
CREATE TRIGGER trg_briefs_update BEFORE UPDATE ON briefs FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS trg_matches_update ON matches;
CREATE TRIGGER trg_matches_update BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
