import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    month: '2026-09',
    teamName: 'Engineering & Product',
    rankings: [
      { rank: 1, alias: 'EcoPulse_44', points: 1450, streakDays: 14, badge: 'Gold' },
      { rank: 2, alias: 'FocusZen_89', points: 1210, streakDays: 10, badge: 'Silver' },
      { rank: 3, alias: 'HydraMaster_12', points: 980, streakDays: 7, badge: 'Bronze' },
      { rank: 4, alias: 'ErgoPacer_05', points: 840, streakDays: 6, badge: 'Bronze' },
    ],
  });
});

export default router;
