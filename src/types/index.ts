export type UserRole = 'brand' | 'creator' | 'admin';
export type AvailabilityStatus = 'available' | 'busy' | 'away';
export type BriefStatus = 'open' | 'matched' | 'closed';
export type MatchStatus = 'suggested' | 'saved_to_picks' | 'interview_invited' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string | null;
  company_name?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreatorProfile {
  user_id: string;
  slug?: string | null;
  headline: string;
  bio: string | null;
  location: string | null;
  hourly_rate: number;
  rating: number;
  verified?: boolean;
  specializations: string[];
  languages?: string[];
  availability_status: AvailabilityStatus;
  created_at: Date | string;
  updated_at: Date | string;
  // Join properties
  user?: Partial<User>;
  portfolios?: Portfolio[];
  reviews?: CreatorReview[];
  packages?: CreatorPackage[];
}

export interface Portfolio {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type?: string;
  tags: string[];
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreatorReview {
  id: string;
  creator_id: string;
  brand_name: string;
  author_name: string;
  rating: number;
  review_text: string;
  review_date?: string | null;
  created_at: Date | string;
}

export interface CreatorPackage {
  id: string;
  creator_id: string;
  name: string;
  price: number;
  delivery_time?: string | null;
  features: string[];
  created_at: Date | string;
}

export interface Brief {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  required_specializations: string[];
  budget_range: string | null;
  max_budget?: number | null;
  status: BriefStatus;
  created_at: Date | string;
  updated_at: Date | string;
  brand?: Partial<User>;
}

export interface Match {
  id: string;
  brief_id: string;
  creator_id: string;
  match_score: number;
  match_explanation: string | null;
  matched_skills?: string[];
  status: MatchStatus;
  created_at: Date | string;
  updated_at: Date | string;
  creator?: any;
  brief?: Brief;
}

export interface SavedPick {
  id: string;
  brand_id: string;
  creator_id: string;
  note?: string | null;
  created_at: Date | string;
  creator?: any;
}

export interface InterviewInvite {
  id: string;
  brand_id: string;
  creator_id: string;
  brief_id?: string | null;
  message?: string | null;
  proposed_date?: string | null;
  status: string; // 'pending', 'accepted', 'declined', 'completed'
  created_at: Date | string;
  updated_at: Date | string;
  creator?: any;
  brief?: Brief;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}
