import { Router, Response } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ─── GET /api/v1/hr/dashboard ──────────────────────────────────────────────
router.get('/dashboard', optionalAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    // Anonymized aggregated health statistics (preventing individual employee tracking or PII leakage)
    const anonymizedReport = {
      companyName: 'Acme Corp',
      totalSeats: 25,
      activeSeats: 18,
      teamWellnessScore: 88, // Break compliance percentage
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
      generatedAt: new Date().toISOString(),
    };

    res.json(anonymizedReport);
  } catch (err: any) {
    console.error('[HR Dashboard Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve HR dashboard metrics.' });
  }
});

export default router;
