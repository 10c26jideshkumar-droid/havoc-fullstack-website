import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ProjectService } from '../services/projectService';
import { AuthTokenPayload } from '../types';

const router = Router();

const DEFAULT_BRAND_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

// Helper to get active brand ID
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

// POST /api/picks - Save a creator to brand's saved list
router.post('/picks', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = getActiveBrandId(req);
    const { creator_id, note, notes } = req.body;
    if (!creator_id) {
      res.status(400).json({ success: false, error: 'creator_id is required' });
      return;
    }
    const pick = await ProjectService.savePick(brandId, { creator_id, note: note || notes });
    res.status(201).json({
      success: true,
      message: 'Creator saved to My Picks',
      data: pick,
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/picks - Retrieve saved creator picks for a brand
router.get('/picks', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = getActiveBrandId(req);
    const picks = await ProjectService.getSavedPicks(brandId);
    res.status(200).json({
      success: true,
      count: picks.length,
      data: picks,
    });
  } catch (error: any) {
    next(error);
  }
});

// DELETE /api/picks/:creatorId - Remove a creator pick
router.delete('/picks/:creatorId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = getActiveBrandId(req);
    await ProjectService.removePick(brandId, String(req.params.creatorId));
    res.status(200).json({
      success: true,
      message: 'Creator removed from My Picks',
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/invites - List interview invites for brand or creator
router.get('/invites', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, creator_id } = req.query;
    if (role === 'creator' || creator_id) {
      const cid = String(creator_id || '11111111-1111-4111-8111-111111111111');
      const invites = await ProjectService.getInvitesByCreator(cid);
      res.status(200).json({
        success: true,
        count: invites.length,
        data: invites,
      });
      return;
    }
    const brandId = getActiveBrandId(req);
    const invites = await ProjectService.getInvitesByBrand(brandId);
    res.status(200).json({
      success: true,
      count: invites.length,
      data: invites,
    });
  } catch (error: any) {
    next(error);
  }
});

// POST /api/invites - Send an interview invite to a creator
router.post('/invites', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brandId = getActiveBrandId(req);
    const { creator_id, message, brief_id, proposed_date } = req.body;
    if (!creator_id) {
      res.status(400).json({ success: false, error: 'creator_id is required' });
      return;
    }
    const match = await ProjectService.sendInvite(brandId, {
      creator_id,
      message: message || 'Brand invitation to interview on HAVOC platform.',
      brief_id,
      proposed_date: proposed_date || new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString()
    });
    res.status(201).json({
      success: true,
      message: 'Interview invitation sent successfully',
      data: match,
    });
  } catch (error: any) {
    next(error);
  }
});

// PATCH /api/invites/:id/status - Update interview status (e.g. confirmed / declined)
router.patch('/invites/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: 'status is required' });
      return;
    }
    const updated = await ProjectService.updateInviteStatus(String(req.params.id), status);
    res.status(200).json({
      success: true,
      message: `Interview invitation marked as ${status}`,
      data: updated,
    });
  } catch (error: any) {
    next(error);
  }
});

// POST /api/invites/:id/status - Alias for status update
router.post('/invites/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const updated = await ProjectService.updateInviteStatus(String(req.params.id), status || 'confirmed');
    res.status(200).json({
      success: true,
      message: `Interview invitation marked as ${status || 'confirmed'}`,
      data: updated,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
