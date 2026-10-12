import { z } from 'zod';

export const SignupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['brand', 'creator', 'admin']),
    full_name: z.string().min(2, 'Full name is required'),
    avatar_url: z.string().optional(),
    company_name: z.string().optional(),
    // Optional creator fields during signup
    headline: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    hourly_rate: z.number().positive().optional(),
    specializations: z.array(z.string()).optional(),
  }),
});

export const SigninSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const UpdateCreatorProfileSchema = z.object({
  body: z.object({
    headline: z.string().min(2).optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    hourly_rate: z.number().positive().optional(),
    specializations: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    availability_status: z.enum(['available', 'busy', 'away']).optional(),
  }),
});

export const CreateBriefSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(10, 'Natural language brief description is required'),
    required_specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
    budget_range: z.string().optional(),
    max_budget: z.number().optional(),
  }),
});

export const SavePickSchema = z.object({
  body: z.object({
    creator_id: z.string().min(1, 'Creator ID is required'),
    note: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const SendInviteSchema = z.object({
  body: z.object({
    creator_id: z.string().min(1, 'Creator ID is required'),
    brief_id: z.string().optional(),
    message: z.string().min(5, 'Invitation message is required'),
    proposed_date: z.string().optional(),
  }),
});

export const CreatorQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    specialization: z.string().optional(),
    location: z.string().optional(),
    min_rate: z.string().regex(/^\d+$/).transform(Number).optional(),
    max_rate: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort_by: z.enum(['rating', 'hourly_rate_asc', 'hourly_rate_desc', 'newest']).optional(),
    availability: z.enum(['available', 'busy', 'away']).optional(),
  }),
});
