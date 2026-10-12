-- HAVOC Complete Database Backup & DDL
-- Project: onfpbpurkyvkrsczsrbu
-- Bucket: jk/havoc
-- Exported At: 2026-10-12T13:31:45.510Z

-- HAVOC Database Schema (PostgreSQL / Supabase)
-- Supports users, creator profiles, portfolios, reviews, packages, briefs, AI matches, picks, and invites.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('brand', 'creator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('available', 'busy', 'away');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE brief_status AS ENUM ('open', 'matched', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('suggested', 'saved_to_picks', 'interview_invited', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'creator',
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    company_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Creator Profiles Table
CREATE TABLE IF NOT EXISTS creator_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE,
    headline VARCHAR(255) NOT NULL,
    bio TEXT,
    location VARCHAR(150),
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    verified BOOLEAN DEFAULT FALSE,
    specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    availability_status availability_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_slug ON creator_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_creator_specializations ON creator_profiles USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_creator_rating ON creator_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_creator_rate ON creator_profiles(hourly_rate ASC);

-- 4. Portfolios / Showcase Projects
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image', -- 'image', 'video', 'project'
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolios_creator_id ON portfolios(creator_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_tags ON portfolios USING GIN(tags);

-- 5. Creator Reviews (Evidence & social proof)
CREATE TABLE IF NOT EXISTS creator_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
    brand_name VARCHAR(150) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    review_text TEXT NOT NULL,
    review_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_creator_id ON creator_reviews(creator_id);

-- 6. Creator Packages / Service Tiers
CREATE TABLE IF NOT EXISTS creator_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    delivery_time VARCHAR(100),
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packages_creator_id ON creator_packages(creator_id);

-- 7. Briefs / Projects (Created by Brands)
CREATE TABLE IF NOT EXISTS briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    budget_range VARCHAR(100),
    max_budget DECIMAL(10, 2),
    status brief_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_briefs_brand_id ON briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);

-- 8. Matches & AI Recommendations
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
    match_score DECIMAL(5, 2) NOT NULL, -- e.g. 94.50%
    match_explanation TEXT,
    matched_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    status match_status DEFAULT 'suggested',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (brief_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_brief_id ON matches(brief_id);
CREATE INDEX IF NOT EXISTS idx_matches_creator_id ON matches(creator_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score DESC);

-- 9. Brand Saved Creator Picks ("My Picks")
CREATE TABLE IF NOT EXISTS saved_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_picks_brand_id ON saved_picks(brand_id);
CREATE INDEX IF NOT EXISTS idx_saved_picks_creator_id ON saved_picks(creator_id);

-- 10. Interview Invites
CREATE TABLE IF NOT EXISTS interview_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES creator_profiles(user_id) ON DELETE CASCADE,
    brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
    message TEXT,
    proposed_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invites_brand ON interview_invites(brand_id);
CREATE INDEX IF NOT EXISTS idx_invites_creator ON interview_invites(creator_id);

-- Trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_creators_modtime
    BEFORE UPDATE ON creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_briefs_modtime
    BEFORE UPDATE ON briefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- SEED DATA
-- HAVOC Initial Seeding Script (PostgreSQL / Supabase)
-- Populates initial preview creators matching Lovable prototype:
-- Anika Rao, Leo Marchetti, Mei Tanaka, Kiran Das, Sofia Alvarez, Arjun Mehta and Lumen Beauty

-- Insert Brands
INSERT INTO users (id, email, password_hash, role, full_name, avatar_url, company_name)
VALUES 
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'brand@lumen.com', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'brand', 'Lumen Beauty Team', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'Lumen Beauty')
ON CONFLICT (email) DO NOTHING;

-- Insert Creators
INSERT INTO users (id, email, password_hash, role, full_name, avatar_url)
VALUES 
('11111111-1111-4111-8111-111111111111', 'anika@havoc.ai', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'creator', 'Anika Rao', '/assets/voice-wK_EftTy.jpg'),
('22222222-2222-4222-8222-222222222222', 'leo@havoc.ai', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'creator', 'Leo Marchetti', '/assets/film-D2ZajaTW.jpg'),
('33333333-3333-4333-8333-333333333333', 'mei@havoc.ai', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'creator', 'Mei Tanaka', '/assets/fashion-D9rghXxZ.jpg'),
('44444444-4444-4444-8444-444444444444', 'kiran@havoc.ai', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'creator', 'Kiran Das', '/assets/chatbot-D5BS4HUv.jpg'),
('55555555-5555-4555-8555-555555555555', 'sofia@havoc.ai', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'creator', 'Sofia Alvarez', '/assets/agent-CSMXJPRd.jpg'),
('66666666-6666-4666-8666-666666666666', 'arjun@havoc.ai', '$2a$10$wWwX/Y3y0h8iUeY9q4UeEOe8aQhRkM5hLw1GfC2LhO4xNnL/m7tXG', 'creator', 'Arjun Mehta', '/assets/product-DMwkbJiI.jpg')
ON CONFLICT (email) DO NOTHING;

-- Creator Profiles
INSERT INTO creator_profiles (user_id, slug, headline, bio, location, hourly_rate, rating, verified, specializations, languages, availability_status)
VALUES
('11111111-1111-4111-8111-111111111111', 'anika-rao', 'Voice AI engineer', 'I build multilingual voice agents that sound human and resolve real customer issues. 6 years in speech tech, 40+ deployed agents.', 'Bengaluru, India', 85.00, 4.90, true, ARRAY['Voice AI', 'LLM Integration', 'Chatbots', 'Prompt Engineering'], ARRAY['English', 'Hindi', 'Kannada'], 'available'),
('22222222-2222-4222-8222-222222222222', 'leo-marchetti', 'Generative filmmaker', 'Director blending generative video and live action. My shorts have screened at 12 festivals.', 'Milan, Italy', 120.00, 4.80, true, ARRAY['Generative Film', 'AI Video', 'Storyboarding'], ARRAY['Italian', 'English'], 'available'),
('33333333-3333-4333-8333-333333333333', 'mei-tanaka', 'AI fashion image artist', 'Consistent-model AI lookbooks for fashion and beauty brands. Former studio photographer.', 'Tokyo, Japan', 95.00, 4.90, true, ARRAY['AI Image Generation', 'Fashion', 'Prompt Engineering'], ARRAY['Japanese', 'English'], 'busy'),
('44444444-4444-4444-8444-444444444444', 'kiran-das', 'Conversational AI designer', 'I design chatbots that convert — travel, retail and D2C. Strong on flows and LLM guardrails.', 'Kolkata, India', 70.00, 4.70, false, ARRAY['Chatbots', 'LLM Integration', 'UX Writing'], ARRAY['English', 'Bengali', 'Hindi'], 'available'),
('55555555-5555-4555-8555-555555555555', 'sofia-alvarez', 'AI agent architect', 'Autonomous agents for operations and marketing teams — research, reporting and outreach.', 'Madrid, Spain', 140.00, 4.80, true, ARRAY['AI Agents', 'LLM Integration', 'Prompt Engineering'], ARRAY['Spanish', 'English'], 'available'),
('66666666-6666-4666-8666-666666666666', 'arjun-mehta', 'AI product visual artist', 'Surreal product visuals and ad creatives for beauty and D2C brands.', 'Mumbai, India', 60.00, 4.60, false, ARRAY['AI Image Generation', 'AI Video', 'Fashion'], ARRAY['Hindi', 'English', 'Marathi'], 'available')
ON CONFLICT (user_id) DO NOTHING;

-- Portfolios
INSERT INTO portfolios (creator_id, title, description, media_url, media_type, tags)
VALUES
('11111111-1111-4111-8111-111111111111', 'Saathi — bilingual support voice agent', 'Demo call of a Hindi/English support agent handling refunds end-to-end.', '/assets/voice-wK_EftTy.jpg', 'video', ARRAY['Voice AI', 'Support']),
('11111111-1111-4111-8111-111111111111', 'Voice persona moodboard', 'Visual identity for a calm banking voice persona.', '/assets/agent-CSMXJPRd.jpg', 'image', ARRAY['Branding']),
('11111111-1111-4111-8111-111111111111', 'Telecom IVR replacement', 'Replaced a 9-level IVR with an AI agent. Call time down 38%.', '/assets/chatbot-D5BS4HUv.jpg', 'project', ARRAY['Voice AI', 'LLM Integration']),
('22222222-2222-4222-8222-222222222222', 'Monolith — generative short', 'A 3-minute sci-fi short made entirely with generative video.', '/assets/film-D2ZajaTW.jpg', 'video', ARRAY['Generative Film', 'AI Video']),
('33333333-3333-4333-8333-333333333333', 'Lavender Silk lookbook', '12-look lookbook with a single consistent AI model.', '/assets/fashion-D9rghXxZ.jpg', 'image', ARRAY['Fashion', 'AI Image Generation']),
('44444444-4444-4444-8444-444444444444', 'Concierge chat for travel site', 'Booking assistant that lifted conversions 22%.', '/assets/chatbot-D5BS4HUv.jpg', 'project', ARRAY['Chatbots']);

-- Reviews
INSERT INTO creator_reviews (creator_id, brand_name, author_name, rating, review_text, review_date)
VALUES
('11111111-1111-4111-8111-111111111111', 'Northwind Bank', 'Priya M.', 5.0, 'Anika''s agent handled 60% of calls on day one. Clear communication throughout.', 'Aug 2026'),
('11111111-1111-4111-8111-111111111111', 'Zesto Foods', 'Rahul K.', 5.0, 'Brilliant Hindi voice quality — customers didn''t notice it was AI.', 'Jun 2026'),
('22222222-2222-4222-8222-222222222222', 'Maison Lavande', 'Claire D.', 5.0, 'Cinematic quality on a startup budget.', 'Jul 2026');

-- Creator Service Packages
INSERT INTO creator_packages (creator_id, name, price, delivery_time, features)
VALUES
('11111111-1111-4111-8111-111111111111', 'Starter', 900.00, '7 days', ARRAY['1 voice persona', 'Up to 5 intents', '1 language']),
('11111111-1111-4111-8111-111111111111', 'Growth', 2400.00, '14 days', ARRAY['Custom voice', 'Up to 20 intents', '2 languages', 'Analytics']),
('22222222-2222-4222-8222-222222222222', 'Teaser', 1500.00, '10 days', ARRAY['15s film', '2 revisions']);

-- Sample Brand Briefs
INSERT INTO briefs (id, brand_id, title, description, required_specializations, budget_range, max_budget, status)
VALUES
('99999999-9999-4999-8999-999999999999', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Diwali campaign film', 'A 30s generative film for our festive launch, dreamy and cinematic.', ARRAY['Generative Film', 'AI Video'], '$4000 - $6000', 5000.00, 'open')
ON CONFLICT (id) DO NOTHING;

