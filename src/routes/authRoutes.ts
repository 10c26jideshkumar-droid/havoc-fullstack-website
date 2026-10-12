import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { SignupSchema, SigninSchema } from '../validators';

const router = Router();

// POST /api/auth/signup
router.post(
  '/signup',
  validateRequest(SignupSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await AuthService.signup(req.body);
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

// POST /api/auth/signin
router.post(
  '/signin',
  validateRequest(SigninSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await AuthService.signin(req.body);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Invalid credentials',
      });
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
