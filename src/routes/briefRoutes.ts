import { Router, Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import { MatchingService } from '../services/matchingService';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { CreateBriefSchema } from '../validators';

const router = Router();

const DEFAULT_BRAND_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenPayload } from '../types';

function getActiveBrandId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as AuthTokenPayload;
      if (decoded && decoded.userId) return decoded.userId;
    } catch (e) {}
  }
  return DEFAULT_BRAND_ID;
}

// POST /api/briefs - Submit a brand project brief
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = getActiveBrandId(req);
      const brief = await ProjectService.createBrief(brandId, {
        title: req.body.title || 'Creative Campaign Brief',
        description: req.body.description || '',
        required_specializations: req.body.required_specializations || ['AI Video', 'Voice AI'],
        budget_range: req.body.budget_range || '$2,000 - $5,000',
        max_budget: req.body.max_budget || 5000
      });
      res.status(201).json({
        success: true,
        message: 'Project brief submitted successfully',
        data: brief,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// GET /api/briefs - List all briefs created by current brand (or all briefs if none)
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brandId = getActiveBrandId(req);
      let briefs = await ProjectService.getBriefsByBrand(brandId);
      if (!briefs || briefs.length === 0) {
        const { getDb } = require('../db/pool');
        const db = getDb();
        const all = db.prepare('SELECT * FROM briefs ORDER BY created_at DESC').all() as any[];
        briefs = all.map(r => ({ ...r, required_specializations: JSON.parse(r.required_specializations || '[]') }));
      }
      res.status(200).json({
        success: true,
        count: briefs.length,
        data: briefs,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// GET /api/briefs/:id - Get specific brief details
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const briefId = req.params.id as string;
      const brief = await ProjectService.getBriefById(briefId);
      if (!brief) {
        res.status(404).json({ success: false, error: 'Brief not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: brief,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// POST /api/briefs/:id/match - Run AI matching engine for a brief
router.post(
  '/:id/match',
  authenticate,
  requireRole(['brand', 'admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const briefId = req.params.id as string;
      const matches = await MatchingService.runMatchingForBrief(briefId);
      res.status(200).json({
        success: true,
        message: 'AI matching completed successfully',
        total_matches: matches.length,
        data: matches,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// POST /api/briefs/recommend - Dynamic AI creator matching for brand campaigns
router.post(
  '/recommend',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { description, industry, target_audience, budget, preferred_skills, content_format, goals } = req.body;
      const recommendations = await MatchingService.recommendCreatorsForCampaign({
        description,
        industry,
        target_audience,
        budget: budget ? Number(budget) : undefined,
        preferred_skills: Array.isArray(preferred_skills) ? preferred_skills : (preferred_skills ? [preferred_skills] : []),
        content_format,
        goals,
      });

      res.status(200).json({
        success: true,
        message: 'AI creator recommendations computed successfully',
        count: recommendations.length,
        data: recommendations,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
