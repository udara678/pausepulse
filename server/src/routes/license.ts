import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST /api/v1/license/verify ───────────────────────────────────────────
// Called by Electron app on launch / activation
router.post('/verify', async (req, res) => {
  const { key } = req.body;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ activated: false, error: 'No license key provided' });
  }

  const license = await prisma.licenseKey.findUnique({ where: { key } });

  if (!license) {
    return res.json({ activated: false, error: 'Invalid license key' });
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return res.json({ activated: false, error: 'License expired', expired: true });
  }

  // Mark as activated if first time
  if (!license.activatedAt) {
    await prisma.licenseKey.update({
      where: { key },
      data: { activatedAt: new Date() },
    });
  }

  return res.json({
    activated: true,
    plan: license.plan,
    email: license.email,
    expiresAt: license.expiresAt,
  });
});

export default router;
