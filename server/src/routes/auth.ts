import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pausepulse_jwt_secret_key_2026';

// Mock DB for auth endpoints (can be connected to Prisma)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign(
      { userId: 'user_' + Date.now(), email, role: 'EMPLOYEE' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Registration successful',
      token,
      user: {
        id: 'user_' + Date.now(),
        name: name || 'Wellness User',
        email,
        companyName: companyName || 'Default Company',
        role: 'EMPLOYEE',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const token = jwt.sign(
      { userId: 'usr_demo_101', email, role: 'EMPLOYEE' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: 'usr_demo_101',
        name: 'Udara',
        email,
        points: 240,
        streakDays: 5,
        role: 'EMPLOYEE',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
