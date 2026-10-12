import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { memoryStore } from '../db/memoryStore';
import { AuthService } from './authService';
import { CreatorService } from './creatorService';
import { Brief, Match, CreatorProfile } from '../types';

export interface ScoredMatchResult {
  creator: any;
  match_score: number;
  match_explanation: string;
  matched_skills: string[];
  status: string;
}

export class MatchingService {
  /**
   * Matches a brief against creator profiles using intelligent scoring:
   * 1. Specialization overlap (50% weight)
   * 2. Semantic text relevance in headline/bio (25% weight)
   * 3. Creator quality signals: rating (15% weight)
   * 4. Availability status bonus (10% weight)
   */
  public static calculateMatch(
    brief: { title: string; description: string; required_specializations: string[] },
    creator: any
  ): { score: number; explanation: string; matchedSkills: string[] } {
    const briefText = `${brief.title} ${brief.description}`.toLowerCase();
    const requiredSpecs = (brief.required_specializations || []).map(s => s.toLowerCase());
    const creatorSpecs = (creator.specializations || []).map((s: string) => s.toLowerCase());

    // 1. Specialization Match (0 - 50 points)
    const matchedSkills: string[] = [];
    let specScore = 0;
    if (requiredSpecs.length > 0) {
      for (const req of requiredSpecs) {
        const found = creatorSpecs.find((cs: string) => cs.includes(req) || req.includes(cs));
        if (found) {
          matchedSkills.push(req);
        }
      }
      specScore = (matchedSkills.length / requiredSpecs.length) * 50;
    } else {
      specScore = 40;
    }

    // 2. Keyword & Context Relevance (0 - 25 points)
    let keywordScore = 0;
    const creatorBioAndHeadline = `${creator.headline} ${creator.bio || ''}`.toLowerCase();
    
    const words = briefText
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'that', 'this', 'have', 'from', 'need', 'want', 'looking'].includes(w));
    
    const matchedKeywords = words.filter(word => creatorBioAndHeadline.includes(word));
    keywordScore = Math.min(25, (matchedKeywords.length / Math.max(1, Math.min(words.length, 10))) * 25);

    // 3. Quality signals (0 - 15 points)
    const ratingScore = Math.min(15, ((Number(creator.rating) || 5.0) / 5.0) * 15);

    // 4. Availability bonus (0 - 10 points)
    let availabilityScore = 5;
    if (creator.availability_status === 'available') {
      availabilityScore = 10;
    } else if (creator.availability_status === 'busy') {
      availabilityScore = 3;
    } else {
      availabilityScore = 0;
    }

    const totalScore = Math.round(Math.min(99, Math.max(45, specScore + keywordScore + ratingScore + availabilityScore)));

    // Generate human-readable AI explanation
    let explanation = '';
    if (matchedSkills.length > 0) {
      explanation += `Proven domain expert in ${matchedSkills.map(s => `"${s.toUpperCase()}"`).join(', ')}. `;
    }
    if (matchedKeywords.length > 0) {
      explanation += `Strong background aligning with "${matchedKeywords.slice(0, 3).join(', ')}" required in the brief. `;
    }
    explanation += `Holds a ${creator.rating}★ track record in production AI deliverables.`;

    return {
      score: totalScore,
      explanation: explanation.trim(),
      matchedSkills,
    };
  }

  public static async runMatchingForBrief(briefId: string): Promise<ScoredMatchResult[]> {
    const isDb = await AuthService.testDb();

    let brief: Brief;
    if (isDb) {
      const res = await pool.query('SELECT * FROM briefs WHERE id = $1', [briefId]);
      if (res.rows.length === 0) {
        throw new Error('Brief not found');
      }
      brief = res.rows[0];
    } else {
      const b = memoryStore.briefs.get(briefId);
      if (!b) {
        throw new Error('Brief not found');
      }
      brief = b;
    }

    const creators = await CreatorService.listCreators({});
    const results: ScoredMatchResult[] = [];

    for (const creator of creators) {
      const match = this.calculateMatch(brief, creator);
      const matchId = uuidv4();

      if (isDb) {
        await pool.query(
          `INSERT INTO matches (id, brief_id, creator_id, match_score, match_explanation, matched_skills, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'suggested', NOW(), NOW())
           ON CONFLICT (brief_id, creator_id) 
           DO UPDATE SET 
             match_score = EXCLUDED.match_score,
             match_explanation = EXCLUDED.match_explanation,
             matched_skills = EXCLUDED.matched_skills,
             updated_at = NOW()`,
          [matchId, brief.id, creator.user_id, match.score, match.explanation, match.matchedSkills]
        );
      } else {
        let existingMatch: Match | undefined;
        for (const m of memoryStore.matches.values()) {
          if (m.brief_id === brief.id && m.creator_id === creator.user_id) {
            existingMatch = m;
            break;
          }
        }

        if (existingMatch) {
          existingMatch.match_score = match.score;
          existingMatch.match_explanation = match.explanation;
          existingMatch.matched_skills = match.matchedSkills;
          existingMatch.updated_at = new Date().toISOString();
        } else {
          const newMatch: Match = {
            id: matchId,
            brief_id: brief.id,
            creator_id: creator.user_id,
            match_score: match.score,
            match_explanation: match.explanation,
            matched_skills: match.matchedSkills,
            status: 'suggested',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          memoryStore.matches.set(matchId, newMatch);
        }
      }

      results.push({
        creator,
        match_score: match.score,
        match_explanation: match.explanation,
        matched_skills: match.matchedSkills,
        status: 'suggested',
      });
    }

    // Sort by match score descending
    results.sort((a, b) => b.match_score - a.match_score);

    // Update brief status to 'matched' if still open
    if (isDb) {
      await pool.query("UPDATE briefs SET status = 'matched' WHERE id = $1 AND status = 'open'", [briefId]);
    } else {
      if (brief.status === 'open') {
        brief.status = 'matched';
      }
    }

    return results;
  }
}
