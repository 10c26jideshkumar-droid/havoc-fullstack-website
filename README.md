# HAVOC — AI-Native Creator Marketplace Backend

Production-ready backend API service, database architecture, and AI matching engine built for **HAVOC** (corresponding to the frontend prototype at [https://vision-to-creator-connect.lovable.app](https://vision-to-creator-connect.lovable.app)).

---

## Architecture Overview

- **Runtime & Language**: Node.js & TypeScript (ES2022)
- **Framework**: Express.js with Helmet, CORS, Morgan, and Rate Limiting
- **Database**: PostgreSQL / Supabase with Row-Level Security (RLS) policies
- **Dual Storage Engine**: Direct connection pool (`pg`) with automatic transparent in-memory store fallback for instantaneous zero-dependency local testing
- **Authentication**: JWT authentication with Bcrypt password hashing
- **Security & Authorization**: Role-Based Access Control (`brand`, `creator`, `admin`)
- **Data Validation**: Strict schema parsing via Zod
- **AI Matching Engine**: Multi-factor scoring algorithm (specialization overlap, semantic bio/headline context matching, rating signals, and availability bonus) generating dynamic reasoning explanations

---

## Project Structure

```
havoc/
├── src/
│   ├── config/
│   │   └── index.ts                 # Environment and secret configuration
│   ├── db/
│   │   ├── havoc_database_backup.json # Exported JSON data from Supabase storage
│   │   ├── havoc_database_schema_and_seeds.sql # DDL & Seeds from Supabase storage
│   │   ├── memoryStore.ts           # In-memory reactive store
│   │   ├── migrate.ts               # DDL migration executor
│   │   ├── pool.ts                  # PostgreSQL connection pool with SSL support
│   │   ├── schema.sql               # Production PostgreSQL schema definition
│   │   ├── seed.ts                  # Ingestion script loading backup & seed records
│   │   └── supabase_rls.sql         # Supabase Row-Level Security policies
│   ├── middlewares/
│   │   ├── auth.ts                  # JWT verification & requireRole() RBAC guards
│   │   ├── error.ts                 # Global structured error handler
│   │   └── validate.ts              # Zod payload/query validator middleware
│   ├── routes/
│   │   ├── authRoutes.ts            # /api/auth (signup, signin, me)
│   │   ├── briefRoutes.ts           # /api/briefs (create, list, get, match)
│   │   ├── creatorRoutes.ts         # /api/creators (search, profile, portfolios)
│   │   └── pickRoutes.ts            # /api/picks & /api/invites
│   ├── services/
│   │   ├── authService.ts           # Authentication logic & token management
│   │   ├── creatorService.ts        # Creator filtering, profiles, & portfolios
│   │   ├── matchingService.ts       # AI matching engine & explanation generator
│   │   └── projectService.ts        # Briefs, Saved Picks, & Interview Invites
│   ├── types/
│   │   └── index.ts                 # TypeScript domain entities & payload interfaces
│   ├── validators/
│   │   └── index.ts                 # Zod validation schemas
│   └── index.ts                     # Express application bootstrap & server start
├── tests/
│   └── api.test.ts                  # 10/10 automated E2E integration test suite
├── .env.example                     # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` with your local PostgreSQL or Supabase connection string.

### 3. Run Database Migration & Seeds (Optional if using PostgreSQL / Supabase)
```bash
npm run db:migrate
npm run seed
```

### 4. Start Server
Development mode:
```bash
npm run dev
```

Production build and start:
```bash
npm run build
npm start
```
The server will start at `http://localhost:5000`.

### 5. Run Automated Tests
```bash
npx tsx tests/api.test.ts
```
Expected result: `10 pass, 0 fail`.

---

## API Documentation

### 1. Authentication Endpoints

#### Register User
- **Method & Path**: `POST /api/auth/signup`
- **Body**:
```json
{
  "email": "sarah@lumina-ai.com",
  "password": "Password123!",
  "role": "brand",
  "full_name": "Sarah Chen",
  "company_name": "Lumina Dynamics"
}
```

#### User Sign In
- **Method & Path**: `POST /api/auth/signin`
- **Body**:
```json
{
  "email": "brand@lumen.com",
  "password": "Password123!"
}
```
- **Response**: Returns JWT token and sanitized user profile.

#### Current Session Profile
- **Method & Path**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`

---

### 2. Creator Discovery & Profiles

#### List & Filter Creators
- **Method & Path**: `GET /api/creators`
- **Query Parameters**:
  - `q`: Free-text search matching name, headline, bio, or specializations
  - `specialization`: e.g., `Voice AI`, `AI Video`, `Generative Film`, `Chatbots`
  - `location`: e.g., `Bengaluru`, `Milan`, `Tokyo`
  - `min_rate` & `max_rate`: Hourly rate range
  - `sort_by`: `rating` | `hourly_rate_asc` | `hourly_rate_desc` | `newest`
  - `availability`: `available` | `busy` | `away`

#### Get Single Creator Profile
- **Method & Path**: `GET /api/creators/:id`
- **Params**: Creator user ID or slug (e.g., `11111111-1111-4111-8111-111111111111` or `anika-rao`)
- **Returns**: Full profile with joined `portfolios`, `reviews`, and `packages`.

#### Update Creator Profile (Creator RBAC)
- **Method & Path**: `PUT /api/creators/profile`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Body**:
```json
{
  "headline": "Senior Voice AI Engineer & Conversational Architect",
  "hourly_rate": 95.0,
  "specializations": ["Voice AI", "LLM Integration", "WebRTC"],
  "availability_status": "available"
}
```

---

### 3. Brand Briefs & AI Matching Engine

#### Submit Brand Project Brief (Brand RBAC)
- **Method & Path**: `POST /api/briefs`
- **Headers**: `Authorization: Bearer <brand_token>`
- **Body**:
```json
{
  "title": "Hindi/English Customer Support Voice Bot",
  "description": "Looking for an expert to build a low latency bilingual voice bot with LLM guardrails.",
  "required_specializations": ["Voice AI", "LLM Integration", "Chatbots"],
  "budget_range": "$3,000 - $5,000",
  "max_budget": 5000
}
```

#### Run AI Matching Engine
- **Method & Path**: `POST /api/briefs/:id/match`
- **Headers**: `Authorization: Bearer <brand_token>`
- **Description**: Runs multi-factor matching across all active creators and scores them against brief requirements.
- **Sample Output**:
```json
{
  "success": true,
  "message": "AI matching completed successfully",
  "total_matches": 6,
  "data": [
    {
      "creator": {
        "id": "11111111-1111-4111-8111-111111111111",
        "full_name": "Anika Rao",
        "headline": "Voice AI engineer",
        "rating": 4.9,
        "specializations": ["Voice AI", "LLM Integration", "Chatbots", "Prompt Engineering"]
      },
      "match_score": 95,
      "match_explanation": "Proven domain expert in \"VOICE AI\", \"LLM INTEGRATION\", \"CHATBOTS\". Strong background aligning with brief requirements. Holds a 4.9★ track record in production AI deliverables.",
      "matched_skills": ["voice ai", "llm integration", "chatbots"],
      "status": "suggested"
    }
  ]
}
```

---

### 4. Saved Creator Picks & Interview Invites

#### Save Creator to "My Picks"
- **Method & Path**: `POST /api/picks`
- **Headers**: `Authorization: Bearer <brand_token>`
- **Body**:
```json
{
  "creator_id": "11111111-1111-4111-8111-111111111111",
  "note": "Top candidate for bilingual voice support bot"
}
```

#### Retrieve Brand's Saved Picks
- **Method & Path**: `GET /api/picks`
- **Headers**: `Authorization: Bearer <brand_token>`

#### Send Interview Invite
- **Method & Path**: `POST /api/invites`
- **Headers**: `Authorization: Bearer <brand_token>`
- **Body**:
```json
{
  "creator_id": "11111111-1111-4111-8111-111111111111",
  "brief_id": "99999999-9999-4999-8999-999999999999",
  "message": "We loved your portfolio and would like to schedule a 30-min introductory interview.",
  "proposed_date": "2026-10-25T14:00:00Z"
}
```

---

## Seed Accounts Available Out-of-the-Box

All seeded accounts share the default development password: `Password123!`

- **Brand Account**:
  - `brand@lumen.com` (Lumen Beauty)
- **Creator Accounts**:
  - `anika@havoc.ai` (Anika Rao — Voice AI Engineer)
  - `leo@havoc.ai` (Leo Marchetti — Generative Filmmaker)
  - `mei@havoc.ai` (Mei Tanaka — AI Fashion Artist)
  - `kiran@havoc.ai` (Kiran Das — Conversational AI Designer)
  - `sofia@havoc.ai` (Sofia Alvarez — AI Agent Architect)
  - `arjun@havoc.ai` (Arjun Mehta — AI Product Visual Artist)
#   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 #   h a v o c - f u l l s t a c k - w e b s i t e  
 