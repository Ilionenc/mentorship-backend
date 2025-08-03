import { Request, Response, NextFunction } from 'express';

export const checkRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== requiredRole) {
      console.log('🔐 BLOCKED: User role is', req.user?.role, 'Expected:', requiredRole);
      return res.status(403).json({ error: `Access denied: ${requiredRole} only` });
    }

    console.log('✅ ALLOWED: Role =', req.user.role);
    next();
  };
};