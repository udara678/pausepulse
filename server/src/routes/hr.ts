import { Router, Request, Response } from 'express';

const router = Router();

router.get('/dashboard', (_req: Request, res: Response): void => {
  res.json({
    companyName: 'Acme Corp',
    totalSeats: 25,
    activeSeats: 18,
    teamWellnessScore: 88, // 88% break compliance
    monthlyHydrationAvgMl: 1950,
    anonymizedStats: {
      averageBreaksPerDay: 4.8,
      averageFocusSessionMins: 26,
      totalBreaksCompletedThisMonth: 1240,
    },
    rewardsActive: [
      { id: 'rew_1', title: '$20 Coffee Voucher', pointsRequired: 1000, type: 'VOUCHER' },
      { id: 'rew_2', title: 'Half-Day Wellness Leave', pointsRequired: 2500, type: 'PERK' },
    ],
  });
});

export default router;
