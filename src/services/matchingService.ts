import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/pool';
import { CreatorService } from './creatorService';
import { Brief, Match } from '../types';

export interface ScoredMatchResult {
  creator: any;
  match_score: number;
  match_explanation: string;
  matched_skills: string[];
  status: string;
}

export class MatchingService {
  public static calculateMatch(
    brief: { title: string; description: string; required_specializations: string[] },
    creator: any
  ): { score: number; explanation: string; matchedSkills: string[] } {
    const briefText = `${brief.title} ${brief.description}`.toLowerCase();
    const requiredSpecs = (brief.required_specializations || []).map(s => s.toLowerCase());
    const creatorSpecs = (creator.specializations || []).map((s: string) => s.toLowerCase());

    const matchedSkills: string[] = [];
    let specScore = 0;
    if (requiredSpecs.length > 0) {
      for (const req of requiredSpecs) {
        if (creatorSpecs.find((cs: string) => cs.includes(req) || req.includes(cs))) {
          matchedSkills.push(req);
        }
      }
      specScore = (matchedSkills.length / requiredSpecs.length) * 50;
    } else {
      specScore = 40;
    }

    let keywordScore = 0;
    const creatorText = `${creator.headline} ${creator.bio || ''}`.toLowerCase();
    const words = briefText.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'that', 'this', 'have', 'from', 'need', 'want', 'looking'].includes(w));
    const matchedKw = words.filter(w => creatorText.includes(w));
    keywordScore = Math.min(25, (matchedKw.length / Math.max(1, Math.min(words.length, 10))) * 25);

    const ratingScore = Math.min(15, ((Number(creator.rating) || 5.0) / 5.0) * 15);

    let availScore = 5;
    if (creator.availability_status === 'available') availScore = 10;
    else if (creator.availability_status === 'busy') availScore = 3;
    else availScore = 0;

    const totalScore = Math.round(Math.min(99, Math.max(45, specScore + keywordScore + ratingScore + availScore)));

    let explanation = '';
    if (matchedSkills.length > 0) {
      explanation += `Proven domain expert in ${matchedSkills.map(s => `"${s.toUpperCase()}"`).join(', ')}. `;
    }
    if (matchedKw.length > 0) {
      explanation += `Strong background aligning with "${matchedKw.slice(0, 3).join(', ')}" required in the brief. `;
    }
    explanation += `Holds a ${creator.rating}★ track record in production AI deliverables.`;

    return { score: totalScore, explanation: explanation.trim(), matchedSkills };
  }

  public static async runMatchingForBrief(briefId: string): Promise<ScoredMatchResult[]> {
    const db = getDb();
    const brief = db.prepare('SELECT * FROM briefs WHERE id = ?').get(briefId) as any;
    if (!brief) throw new Error('Brief not found');

    brief.required_specializations = JSON.parse(brief.required_specializations || '[]');

    const creators = await CreatorService.listCreators({});
    const results: ScoredMatchResult[] = [];

    const upsertMatch = db.prepare(`
      INSERT INTO matches (id, brief_id, creator_id, match_score, match_explanation, matched_skills, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'suggested', datetime('now'), datetime('now'))
      ON CONFLICT(brief_id, creator_id) DO UPDATE SET
        match_score = excluded.match_score,
        match_explanation = excluded.match_explanation,
        matched_skills = excluded.matched_skills,
        updated_at = datetime('now')
    `);

    for (const creator of creators) {
      const match = this.calculateMatch(brief, creator);
      upsertMatch.run(uuidv4(), brief.id, creator.user_id, match.score, match.explanation, JSON.stringify(match.matchedSkills));
      results.push({
        creator,
        match_score: match.score,
        match_explanation: match.explanation,
        matched_skills: match.matchedSkills,
        status: 'suggested',
      });
    }

    results.sort((a, b) => b.match_score - a.match_score);
    db.prepare("UPDATE briefs SET status = 'matched' WHERE id = ? AND status = 'open'").run(briefId);
    return results;
  }
}
