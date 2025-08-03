import { UserPayload } from '../middleware/authMiddleware';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}