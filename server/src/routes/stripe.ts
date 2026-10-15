import express from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { checkoutLimiter } from '../middleware/rateLimiter';
import { validateBody, CreateCheckoutDTOSchema } from '../middleware/validate';

const router = express.Router();
const prisma = new PrismaClient();
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    })
  : null;

// ─── POST /api/stripe/create-checkout ──────────────────────────────────────
router.post(
  '/create-checkout',
  checkoutLimiter,
  validateBody(CreateCheckoutDTOSchema),
  async (req, res): Promise<void> => {
    try {
      const { plan } = req.body;

      if (!stripe) {
        res.status(503).json({ error: 'Stripe integration is not configured on this server.' });
        return;
      }

      const priceId =
        plan === 'yearly'
          ? env.STRIPE_PRICE_ID_YEARLY
          : plan === 'team'
          ? env.STRIPE_PRICE_ID_TEAM
          : env.STRIPE_PRICE_ID_MONTHLY;

      if (!priceId) {
        res.status(400).json({ error: 'Invalid or unconfigured plan price ID.' });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.FRONTEND_URL}/#pricing`,
        metadata: { plan },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error('[Stripe Checkout Error]:', err);
      res.status(500).json({ error: 'Failed to initiate checkout session.' });
    }
  }
);

// ─── POST /api/stripe/webhook ───────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !env.STRIPE_WEBHOOK_SECRET || !stripe) {
    res.status(400).json({ error: 'Webhook signature verification unavailable.' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send('Webhook Error: Signature verification failed');
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_email || session.customer_details?.email || '';
    const plan = session.metadata?.plan || 'monthly';

    // Generate a secure unique license key
    const licenseKey = `PP-${uuidv4().toUpperCase().replace(/-/g, '').substring(0, 16)}`;

    // Save to database
    await prisma.licenseKey.create({
      data: {
        key: licenseKey,
        email: customerEmail,
        plan,
        stripeSessionId: session.id,
        expiresAt:
          plan === 'yearly'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Send license key via email if Resend is configured
    if (resend && customerEmail) {
      try {
        await resend.emails.send({
          from: 'PausePulse <noreply@pausepulse.app>',
          to: customerEmail,
          subject: '🎉 Your PausePulse Pro License Key',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
              <h1 style="color: #6366f1; margin-bottom: 8px;">Welcome to PausePulse Pro! 🎯</h1>
              <p style="color: #94a3b8;">Thank you for your purchase. Here is your license key:</p>

              <div style="background: #1e293b; border: 1px solid #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #a5b4fc; letter-spacing: 2px;">${licenseKey}</span>
              </div>

              <h3 style="color: #e2e8f0;">How to activate:</h3>
              <ol style="color: #94a3b8; line-height: 1.8;">
                <li>Open PausePulse on your desktop</li>
                <li>Click the <strong style="color: #6366f1;">Activate License</strong> button</li>
                <li>Paste your key above and click <strong style="color: #6366f1;">Activate</strong></li>
                <li>Enjoy all Pro features! 🚀</li>
              </ol>

              <p style="color: #64748b; font-size: 12px; margin-top: 32px;">
                Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)} | 
                Need help? Reply to this email.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send license key email:', emailErr);
      }
    }

    console.log(`✅ License issued: ${licenseKey} → ${customerEmail}`);
  }

  res.json({ received: true });
});

export default router;
