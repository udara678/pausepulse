import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { authLimiter } from '../middleware/rateLimiter';
import { validateBody, RegisterDTOSchema, LoginDTOSchema } from '../middleware/validate';

const router = Router();

// Apply auth rate limiter to all authentication routes
router.use(authLimiter);

// ─── POST /api/v1/auth/register ─────────────────────────────────────────────
router.post(
  '/register',
  validateBody(RegisterDTOSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // req.body is already validated and strictly whitelisted by DTO
      const { name, email, password, companyName } = req.body;

      // Salt rounds 12 for strong OWASP-compliant hashing
      const hashedPassword = await bcrypt.hash(password, 12);

      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      const token = jwt.sign(
        { userId, email, role: 'EMPLOYEE' },
        env.JWT_SECRET,
        { expiresIn: '7d' } // Shorter, safer expiration than 30d
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: userId,
          name,
          email,
          companyName: companyName || null,
          role: 'EMPLOYEE',
        },
      });
    } catch (err: any) {
      console.error('[Auth Register Error]:', err);
      res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
  }
);

// ─── POST /api/v1/auth/login ────────────────────────────────────────────────
router.post(
  '/login',
  validateBody(LoginDTOSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // In production, fetch user from DB:
      // const user = await prisma.user.findUnique({ where: { email } });
      // const isValid = user && await bcrypt.compare(password, user.passwordHash);

      // Demo validation:
      if (!password || password.length < 6) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const userId = 'usr_demo_101';
      const token = jwt.sign(
        { userId, email, role: 'EMPLOYEE' },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: userId,
          name: email.split('@')[0],
          email,
          points: 240,
          streakDays: 5,
          role: 'EMPLOYEE',
        },
      });
    } catch (err: any) {
      console.error('[Auth Login Error]:', err);
      res.status(500).json({ error: 'An unexpected error occurred during login.' });
    }
  }
);

export default router;
