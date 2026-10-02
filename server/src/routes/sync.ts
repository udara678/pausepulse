import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response): void => {
  const { userId, date, activeMinutes, idleMinutes, breaksCompleted, waterIntakeMl, pointsEarned } = req.body;

  res.json({
    success: true,
    syncedAt: new Date().toISOString(),
    updatedStats: {
      userId: userId || 'usr_demo_101',
      totalPoints: (pointsEarned || 0) + 180,
      streakDays: 5,
      date: date || new Date().toISOString().split('T')[0],
    },
  });
});

export default router;
