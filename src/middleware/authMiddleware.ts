import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  role: string;
}

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.log('authenticateUser middleware triggered');

  const authHeader = req.headers.authorization;

  console.log('authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {

    console.log('No token provided', authHeader);

    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    console.log('Token verified', decoded);

    req.user = decoded; // 👈 we will tell TypeScript about this in a moment
     console.log('Authenticated user:', req.user);

    next();
  } catch (err) {
    
    console.log('Token verification failed');

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

