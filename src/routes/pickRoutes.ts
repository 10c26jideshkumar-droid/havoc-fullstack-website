import { Router, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { SavePickSchema, SendInviteSchema } from '../validators';

const router = Router();

// POST /api/picks - Save a creator to brand's saved list
router.post(
  '/picks',
  authenticate,
  requireRole(['brand', 'admin']),
  validateRequest(SavePickSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pick = await ProjectService.savePick(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Creator saved to My Picks',
        data: pick,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// GET /api/picks - Retrieve saved creator picks for a brand
router.get(
  '/picks',
  authenticate,
  requireRole(['brand', 'admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const picks = await ProjectService.getSavedPicks(req.user!.userId);
      res.status(200).json({
        success: true,
        count: picks.length,
        data: picks,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// POST /api/invites - Send an interview invite to a creator for a specific brief
router.post(
  '/invites',
  authenticate,
  requireRole(['brand', 'admin']),
  validateRequest(SendInviteSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const match = await ProjectService.sendInvite(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Interview invitation sent successfully',
        data: match,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
