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

  public static async recommendCreatorsForCampaign(campaign: {
    description?: string;
    industry?: string;
    target_audience?: string;
    budget?: number;
    preferred_skills?: string[];
    content_format?: string;
    goals?: string;
  }) {
    const db = getDb();
    const creators = await CreatorService.listCreators({});
    const skills = (campaign.preferred_skills || []).map(s => s.toLowerCase());
    const descText = `${campaign.description || ''} ${campaign.industry || ''} ${campaign.content_format || ''} ${campaign.goals || ''} ${campaign.target_audience || ''}`.toLowerCase();

    const scored = creators.map((creator: any) => {
      // Get creator's actual portfolio items
      const portfolios = db.prepare('SELECT * FROM portfolios WHERE creator_id = ?').all(creator.user_id) as any[];
      const creatorSkills = (creator.specializations || []).map((s: string) => s.toLowerCase());

      // 1. Skill overlap
      const matchedSkills = (creator.specializations || []).filter((s: string) => {
        const lower = s.toLowerCase();
        return skills.some(req => req.includes(lower) || lower.includes(req)) || descText.includes(lower);
      });

      // 2. Portfolio evidence
      const relevantPortfolios = portfolios.filter(p => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const tags = JSON.parse(p.tags || '[]').map((t: string) => t.toLowerCase());
        return (
          tags.some((t: string) => skills.includes(t) || descText.includes(t)) ||
          matchedSkills.some((ms: string) => title.includes(ms.toLowerCase()) || desc.includes(ms.toLowerCase())) ||
          (campaign.content_format && (p.media_type === campaign.content_format.toLowerCase() || title.includes(campaign.content_format.toLowerCase())))
        );
      });

      // 3. Budget alignment
      const packages = db.prepare('SELECT * FROM creator_packages WHERE creator_id = ?').all(creator.user_id) as any[];
      const minPackagePrice = packages.length > 0 ? Math.min(...packages.map(p => p.price)) : (creator.hourly_rate * 10);
      const fitsBudget = campaign.budget ? minPackagePrice <= campaign.budget : true;

      // 4. Scoring logic
      let score = 45;
      if (skills.length > 0) {
        score += Math.min(35, (matchedSkills.length / Math.max(1, skills.length)) * 35);
      } else if (matchedSkills.length > 0) {
        score += Math.min(30, matchedSkills.length * 10);
      }
      if (relevantPortfolios.length > 0) {
        score += Math.min(15, relevantPortfolios.length * 6);
      }
      if (fitsBudget) score += 5;
      if (creator.availability_status === 'available') score += 5;
      score = Math.min(99, Math.round(score + ((creator.rating - 4.5) * 8)));

      // 5. Evidence-based explanation reasons
      const reasons: string[] = [];
      if (matchedSkills.length > 0) {
        reasons.push(`Mastery in verified skills: ${matchedSkills.join(', ')} directly matching your campaign.`);
      }
      if (relevantPortfolios.length > 0) {
        reasons.push(`Proven portfolio evidence: "${relevantPortfolios[0].title}" (${relevantPortfolios[0].media_type || 'project'}).`);
      }
      if (campaign.budget) {
        reasons.push(fitsBudget
          ? `Budget match: Package tiers start from $${minPackagePrice}, within your $${campaign.budget} target.`
          : `Package starting rate is $${minPackagePrice} ($${creator.hourly_rate}/hr).`
        );
      }
      reasons.push(`Maintains a ${creator.rating}★ client review rating with ${creator.availability_status === 'available' ? 'immediate availability' : 'busy schedule'}.`);

      return {
        creator,
        score,
        matched_skills: matchedSkills,
        portfolio_evidence: relevantPortfolios.map(p => ({
          id: p.id,
          title: p.title,
          media_url: p.media_url,
          media_type: p.media_type,
        })),
        reasons,
      };
    });

    return scored.sort((a, b) => b.score - a.score);
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
