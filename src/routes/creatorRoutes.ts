import { Router, Request, Response, NextFunction } from 'express';
import { CreatorService } from '../services/creatorService';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { UpdateCreatorProfileSchema, CreatorQuerySchema } from '../validators';

const router = Router();

// GET /api/creators - List/search creators with rich filters
router.get(
  '/',
  validateRequest(CreatorQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, specialization, location, min_rate, max_rate, sort_by, availability } = req.query as any;

      const creators = await CreatorService.listCreators({
        q,
        specialization,
        location,
        min_rate: min_rate ? Number(min_rate) : undefined,
        max_rate: max_rate ? Number(max_rate) : undefined,
        sort_by,
        availability,
      });

      res.status(200).json({
        success: true,
        count: creators.length,
        data: creators,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// PUT /api/creators/profile - Update creator's own profile (Requires 'creator' role)
router.put(
  '/profile',
  authenticate,
  requireRole(['creator']),
  validateRequest(UpdateCreatorProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await CreatorService.updateProfile(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Creator profile updated successfully',
        data: updated,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// POST /api/creators/portfolio - Add portfolio showcase project
router.post(
  '/portfolio',
  authenticate,
  requireRole(['creator']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portfolio = await CreatorService.addPortfolio(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Portfolio item added successfully',
        data: portfolio,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// GET /api/creators/:id - Get full creator profile with portfolios and reviews
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.params.id as string;
      const creator = await CreatorService.getCreatorById(creatorId);
      res.status(200).json({
        success: true,
        data: creator,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message || 'Creator not found',
      });
    }
  }
);

export default router;
