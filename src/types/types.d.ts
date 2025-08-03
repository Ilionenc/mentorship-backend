// types.d.ts or global.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role?: string;
        // Add other properties if needed
      };
    }
  }
}