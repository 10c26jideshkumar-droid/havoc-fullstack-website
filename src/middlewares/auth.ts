import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenPayload, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
    return;
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to roles [${roles.join(', ')}]`,
      });
      return;
    }

    next();
  };
};
