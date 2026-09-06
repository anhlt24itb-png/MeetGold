import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ message: 'Username is required' });
      }
      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ message: 'Email is required' });
      }
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: 'Password is required' });
      }

      if (username.trim().length < 2) {
        return res.status(400).json({ message: 'Username must be at least 2 characters long' });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.trim())) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }

      const result = await AuthService.register({ username, email, password });
      return res.status(201).json(result);
    } catch (err: any) {
      const isConflict = /already in use|already taken/i.test(err.message || '');
      return res.status(isConflict ? 409 : 400).json({ message: err.message || 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await AuthService.login({ email, password });
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(401).json({ message: err.message || 'Login failed' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({ user: req.user });
  }
}
