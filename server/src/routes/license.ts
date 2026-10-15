import express from 'express';
import { PrismaClient } from '@prisma/client';
import { licenseLimiter } from '../middleware/rateLimiter';
import { validateBody, VerifyLicenseDTOSchema } from '../middleware/validate';

const router = express.Router();
const prisma = new PrismaClient();

router.use(licenseLimiter);

// ─── POST /api/v1/license/verify ───────────────────────────────────────────
// Called by Electron app on launch / activation
router.post(
  '/verify',
  validateBody(VerifyLicenseDTOSchema),
  async (req, res): Promise<void> => {
    try {
      const { key } = req.body;

      const license = await prisma.licenseKey.findUnique({
        where: { key },
        select: {
          key: true,
          plan: true,
          email: true,
          expiresAt: true,
          activatedAt: true,
          // Intentionally omitting internal fields like id, stripeSessionId, etc.
        },
      });

      if (!license) {
        res.status(404).json({ activated: false, error: 'Invalid license key' });
        return;
      }

      if (license.expiresAt && license.expiresAt < new Date()) {
        res.status(403).json({ activated: false, error: 'License expired', expired: true });
        return;
      }

      // Mark as activated if first time
      if (!license.activatedAt) {
        await prisma.licenseKey.update({
          where: { key },
          data: { activatedAt: new Date() },
        });
      }

      res.json({
        activated: true,
        plan: license.plan,
        email: license.email,
        expiresAt: license.expiresAt,
      });
    } catch (err: any) {
      console.error('[License Verify Error]:', err);
      res.status(500).json({ activated: false, error: 'Internal server error while verifying license.' });
    }
  }
);

export default router;
