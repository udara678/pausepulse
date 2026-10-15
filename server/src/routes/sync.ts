import { Router, Response } from 'express';
import { syncLimiter } from '../middleware/rateLimiter';
import { validateBody, SyncDTOSchema } from '../middleware/validate';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(syncLimiter);

router.post(
  '/',
  optionalAuth,
  validateBody(SyncDTOSchema),
  (req: AuthenticatedRequest, res: Response): void => {
    try {
      // DTO whitelisting ensures ONLY allowed fields are present
      const { date, activeMinutes, idleMinutes, breaksCompleted, waterIntakeMl, pointsEarned } = req.body;

      // Extract userId securely from authenticated token or default to session
      const userId = req.user?.userId || 'usr_demo_101';

      res.json({
        success: true,
        syncedAt: new Date().toISOString(),
        updatedStats: {
          userId,
          date,
          activeMinutes,
          idleMinutes,
          breaksCompleted,
          waterIntakeMl,
          totalPoints: pointsEarned + 180,
          streakDays: 5,
        },
      });
    } catch (err: any) {
      console.error('[Sync Error]:', err);
      res.status(500).json({ error: 'Failed to process sync.' });
    }
  }
);

export default router;
