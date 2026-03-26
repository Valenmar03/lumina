// backend/src/services/billing.service.ts
import Stripe from "stripe";
import { prisma } from "../db/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function getPriceIds(currency: string) {
  if (currency === "USD") {
    return {
      base: process.env.STRIPE_PRICE_ID_BASE_USD!,
      extra: process.env.STRIPE_PRICE_ID_EXTRA_USD!,
    };
  }
  return {
    base: process.env.STRIPE_PRICE_ID_BASE_ARS!,
    extra: process.env.STRIPE_PRICE_ID_EXTRA_ARS!,
  };
}

async function getOrCreateStripeCustomer(businessId: string): Promise<string> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { stripeCustomerId: true, name: true },
  });

  if (business.stripeCustomerId) return business.stripeCustomerId;

  const customer = await stripe.customers.create({
    name: business.name,
    metadata: { businessId },
  });

  await prisma.business.update({
    where: { id: businessId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

async function countActiveProfessionals(businessId: string): Promise<number> {
  return prisma.professional.count({
    where: { businessId, active: true },
  });
}

export async function createCheckoutSession(
  businessId: string,
  frontendUrl: string
): Promise<string> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { currency: true, stripeSubscriptionId: true },
  });

  if (business.stripeSubscriptionId) {
    throw Object.assign(new Error("Business already has an active subscription"), { statusCode: 409 });
  }

  const customerId = await getOrCreateStripeCustomer(businessId);
  const activeCount = await countActiveProfessionals(businessId);
  const prices = getPriceIds(business.currency);
  const extraCount = Math.max(0, activeCount - 2);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: prices.base, quantity: 1 },
  ];

  if (extraCount > 0) {
    lineItems.push({ price: prices.extra, quantity: extraCount });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: lineItems,
    success_url: `${frontendUrl}/business-settings?billing=success`,
    cancel_url: `${frontendUrl}/business-settings?billing=cancel`,
    metadata: { businessId },
  });

  return session.url!;
}

export async function createPortalSession(
  businessId: string,
  frontendUrl: string
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(businessId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${frontendUrl}/business-settings`,
  });

  return session.url;
}

export async function updateSubscriptionQuantity(
  businessId: string,
  newActiveCount: number
): Promise<void> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { stripeSubscriptionId: true, currency: true },
  });

  if (!business.stripeSubscriptionId) {
    throw Object.assign(new Error("No active subscription"), { statusCode: 400 });
  }

  const subscription = await stripe.subscriptions.retrieve(
    business.stripeSubscriptionId,
    { expand: ["items"] }
  );

  const prices = getPriceIds(business.currency);
  const extraCount = Math.max(0, newActiveCount - 2);

  const existingExtraItem = subscription.items.data.find(
    (item) => item.price.id === prices.extra
  );

  if (existingExtraItem) {
    if (extraCount === 0) {
      await stripe.subscriptionItems.del(existingExtraItem.id, {
        proration_behavior: "create_prorations",
      });
    } else {
      await stripe.subscriptionItems.update(existingExtraItem.id, {
        quantity: extraCount,
        proration_behavior: "create_prorations",
      });
    }
  } else if (extraCount > 0) {
    await stripe.subscriptionItems.create({
      subscription: business.stripeSubscriptionId,
      price: prices.extra,
      quantity: extraCount,
      proration_behavior: "create_prorations",
    });
  }
}

export async function getBillingStatus(businessId: string) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: {
      subscriptionStatus: true,
      plan: true,
      trialEndsAt: true,
      currency: true,
      billingExempt: true,
      stripeSubscriptionId: true,
    },
  });

  let nextBillingDate: string | null = null;

  if (business.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(
        business.stripeSubscriptionId
      );
      const periodEnd = sub.items.data[0]?.current_period_end;
      if (periodEnd) {
        nextBillingDate = new Date(periodEnd * 1000).toISOString();
      }
    } catch (err) {
      console.warn("[billing] Failed to retrieve subscription period end:", err);
    }
  }

  const activeCount = await countActiveProfessionals(businessId);
  const prices = getPriceIds(business.currency);
  const basePriceAmount = business.currency === "USD" ? 18 : 16000;
  const extraPriceAmount = business.currency === "USD" ? 7 : 7000;
  const extraCount = Math.max(0, activeCount - 2);
  const totalMonthly = basePriceAmount + extraCount * extraPriceAmount;

  return {
    ...business,
    nextBillingDate,
    activeProCount: activeCount,
    totalMonthly,
    extraPriceAmount,
    basePriceAmount,
    extraPriceId: prices.extra,
  };
}

export async function handleWebhookEvent(
  payload: Buffer,
  sig: string
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.metadata?.businessId;
      if (!businessId) break;
      await prisma.business.update({
        where: { id: businessId },
        data: {
          subscriptionStatus: "ACTIVE",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "ACTIVE" },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await prisma.business.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "CANCELED", stripeSubscriptionId: null },
      });
      break;
    }
    default:
      break;
  }
}
