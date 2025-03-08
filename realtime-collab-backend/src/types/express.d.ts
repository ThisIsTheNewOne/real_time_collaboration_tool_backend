import { User } from '../models/User'; // If you have a User model

declare global {
  namespace Express {
    interface Request {
      user?: User | any; // Use proper User type if available
    }
  }
}