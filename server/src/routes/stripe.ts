import express from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// ─── POST /api/stripe/create-checkout ──────────────────────────────────────
// Called from landing page "Buy Now" button
router.post('/create-checkout', async (req, res) => {
  const { plan } = req.body; // 'monthly' | 'yearly' | 'team'

  const priceId =
    plan === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : plan === 'team'
      ? process.env.STRIPE_PRICE_ID_TEAM
      : process.env.STRIPE_PRICE_ID_MONTHLY;

  if (!priceId) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/#pricing`,
    metadata: { plan },
  });

  res.json({ url: session.url });
});

// ─── POST /api/stripe/webhook ───────────────────────────────────────────────
// Stripe calls this after successful payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_email || session.customer_details?.email || '';
    const plan = session.metadata?.plan || 'monthly';

    // Generate a unique license key
    const licenseKey = `PP-${uuidv4().toUpperCase().replace(/-/g, '').substring(0, 16)}`;

    // Save to database
    await prisma.licenseKey.create({
      data: {
        key: licenseKey,
        email: customerEmail,
        plan,
        stripeSessionId: session.id,
        expiresAt: plan === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Send license key via email
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

    console.log(`✅ License issued: ${licenseKey} → ${customerEmail}`);
  }

  res.json({ received: true });
});

export default router;
