-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_saved_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
CREATE POLICY "Users can read their own profile or public profile data"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 2. Creator Profiles Policies
CREATE POLICY "Creator profiles are publicly viewable"
ON creator_profiles FOR SELECT
USING (true);

CREATE POLICY "Creators can update only their own profile"
ON creator_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Creators can insert their own profile"
ON creator_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Portfolios Policies
CREATE POLICY "Portfolios are publicly viewable"
ON portfolios FOR SELECT
USING (true);

CREATE POLICY "Creators can manage their own portfolios"
ON portfolios FOR ALL
USING (EXISTS (
    SELECT 1 FROM creator_profiles 
    WHERE creator_profiles.id = portfolios.creator_id 
    AND creator_profiles.user_id = auth.uid()
));

-- 4. Briefs Policies
CREATE POLICY "Briefs can be read by creator applicants and the owning brand"
ON briefs FOR SELECT
USING (true);

CREATE POLICY "Brands can create briefs"
ON briefs FOR INSERT
WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Brands can update their own briefs"
ON briefs FOR UPDATE
USING (auth.uid() = brand_id);

CREATE POLICY "Brands can delete their own briefs"
ON briefs FOR DELETE
USING (auth.uid() = brand_id);

-- 5. Matches Policies
CREATE POLICY "Matches can be read by the brief owner and matched creator"
ON matches FOR SELECT
USING (
    EXISTS (SELECT 1 FROM briefs WHERE briefs.id = matches.brief_id AND briefs.brand_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM creator_profiles WHERE creator_profiles.id = matches.creator_id AND creator_profiles.user_id = auth.uid())
);

CREATE POLICY "Brands can update match status (invite, accept, reject)"
ON matches FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM briefs WHERE briefs.id = matches.brief_id AND briefs.brand_id = auth.uid())
);

-- 6. Saved Picks Policies
CREATE POLICY "Brands can view and manage their own saved picks"
ON brand_saved_picks FOR ALL
USING (auth.uid() = brand_id);
