import { Router, Request, Response } from 'express';

const router = Router();

router.post('/webhook', (req: Request, res: Response): void => {
  const event = req.body;
  const eventName = event?.meta?.event_name || event?.type || 'subscription_created';

  console.log(`[Billing Webhook] Received event: ${eventName}`);

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
      console.log('Subscription active for customer:', event?.data?.attributes?.user_email);
      break;
    case 'subscription_cancelled':
      console.log('Subscription cancelled for customer:', event?.data?.attributes?.user_email);
      break;
    default:
      console.log('Unhandled webhook event:', eventName);
  }

  res.status(200).json({ received: true });
});

export default router;
