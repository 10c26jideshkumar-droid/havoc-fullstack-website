import { Router, Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import { MatchingService } from '../services/matchingService';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { CreateBriefSchema } from '../validators';

const router = Router();

// POST /api/briefs - Submit a brand project brief (Requires 'brand' role)
router.post(
  '/',
  authenticate,
  requireRole(['brand', 'admin']),
  validateRequest(CreateBriefSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const brief = await ProjectService.createBrief(req.user!.userId, req.body);
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

// GET /api/briefs - List all briefs created by current brand
router.get(
  '/',
  authenticate,
  requireRole(['brand', 'admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const briefs = await ProjectService.getBriefsByBrand(req.user!.userId);
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

export default router;
