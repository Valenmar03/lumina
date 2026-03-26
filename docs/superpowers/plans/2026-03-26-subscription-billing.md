# Subscription & Billing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Stripe-based subscription billing with 14-day trial, blocking modal on expiry, and per-professional pricing.

**Architecture:** Stripe handles payment processing and subscription lifecycle; webhooks update DB state; a backend middleware gates all authenticated routes by subscription status; the frontend shows a non-closeable modal when access is blocked and a warning banner during trial days 13–14.

**Tech Stack:** Stripe Node SDK (`stripe`), Prisma, Express middleware, React (SubscriptionGate + TrialBanner components), React Query.

---

## File Map

### Backend — new files
- `backend/src/services/billing.service.ts` — all Stripe API calls (checkout, portal, webhook handling, quantity update)
- `backend/src/controllers/billing.controller.ts` — thin HTTP handlers for billing endpoints
- `backend/src/routes/billing.routes.ts` — billing route definitions (no auth middleware)
- `backend/src/middleware/requireSubscription.ts` — gates routes by subscription status

### Backend — modified files
- `backend/prisma/schema.prisma` — add 5 fields to Business model
- `backend/src/app.ts` — add raw-body webhook route BEFORE `express.json()`; register billing webhook
- `backend/src/routes/index.ts` — import billing routes + requireSubscription middleware
- `backend/src/services/auth.service.ts` — set `trialEndsAt` when creating a business
- `backend/prisma/seed.ts` — set `trialEndsAt` for seed business

### Frontend — new files
- `frontend/src/services/billing.api.ts` — API calls for billing endpoints
- `frontend/src/components/billing/SubscriptionGate.tsx` — fullscreen blocking modal
- `frontend/src/components/billing/TrialBanner.tsx` — top warning banner for days 13–14

### Frontend — modified files
- `frontend/src/types/entities.ts` — extend Business type with new billing fields
- `frontend/src/app/router.tsx` — wrap ProtectedRoute children with SubscriptionGate + TrialBanner
- `frontend/src/pages/BusinessSettingsPage.tsx` — add billing section
- `frontend/src/components/professionals/ProfessionalDetailModal.tsx` — intercept save when activating extra professional

---

## Task 1: DB Migration — add billing fields to Business

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create migration: run `npx prisma migrate dev`

- [ ] **Step 1: Add fields to Business model in schema.prisma**

Open `backend/prisma/schema.prisma`. Inside `model Business`, after `subscriptionStatus SubscriptionStatus @default(TRIAL)`, add:

```prisma
stripeCustomerId     String?   @unique
stripeSubscriptionId String?   @unique
trialEndsAt          DateTime?
currency             String    @default("ARS")
billingExempt        Boolean   @default(false)
```

The Business model block should look like:
```prisma
model Business {
  id                        String             @id @default(uuid())
  name                      String
  slug                      String             @unique
  timezone                  String             @default("America/Argentina/Buenos_Aires")
  mpAccessToken             String?
  waPhoneNumberId           String?
  waAccessToken             String?
  waReminderHours           Int?
  emailNotificationsEnabled Boolean            @default(true)
  emailReminderHours        Int?               @default(24)
  plan                      PlanType           @default(STARTER)
  subscriptionStatus        SubscriptionStatus @default(TRIAL)
  stripeCustomerId          String?            @unique
  stripeSubscriptionId      String?            @unique
  trialEndsAt               DateTime?
  currency                  String             @default("ARS")
  billingExempt             Boolean            @default(false)
  createdAt                 DateTime           @default(now())

  users                        User[]
  professionals                Professional[]
  services                     Service[]
  clients                      Client[]
  appointments                 Appointment[]
  schedules                    ProfessionalSchedule[]
  professionalServices         ProfessionalService[]
  professionalUnavailabilities ProfessionalUnavailability[]

  @@index([createdAt])
}
```

- [ ] **Step 2: Create and apply migration**

Run from `backend/`:
```bash
npx prisma migrate dev --name add_billing_fields
```

Expected output: `✔ Generated Prisma Client` and a new migration folder in `backend/prisma/migrations/`.

- [ ] **Step 3: Update seed to set trialEndsAt**

In `backend/prisma/seed.ts`, find the `prisma.business.create` call and add `trialEndsAt`:

```typescript
const business = await prisma.business.create({
  data: {
    name: "Lumina Studio",
    slug: "lumina",
    timezone: "America/Argentina/Buenos_Aires",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    currency: "ARS",
  },
});
```

- [ ] **Step 4: Commit**

```bash
cd backend && git add prisma/schema.prisma prisma/migrations/ prisma/seed.ts && git commit -m "feat: add billing fields to Business model"
```

---

## Task 2: Install Stripe SDK + configure env vars

**Files:**
- Modify: `backend/package.json` (via npm install)
- Modify: `backend/.env` (manual step, not committed)

- [ ] **Step 1: Install Stripe SDK**

Run from `backend/`:
```bash
npm install stripe
```

Expected: `stripe` appears in `package.json` dependencies.

- [ ] **Step 2: Document required env vars**

Add these to `backend/.env` (use test keys from Stripe dashboard → Developers → API keys):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASE_ARS=price_...
STRIPE_PRICE_ID_BASE_USD=price_...
STRIPE_PRICE_ID_EXTRA_ARS=price_...
STRIPE_PRICE_ID_EXTRA_USD=price_...
FRONTEND_URL=http://localhost:5173
```

In Stripe dashboard, create two Products:
- "Caleio Plan Base" with two prices: ARS 16000/month recurring and USD 18/month recurring
- "Caleio Profesional Extra" with two prices: ARS 7000/month recurring per unit and USD 7/month recurring per unit

Note the Price IDs (start with `price_`) and paste them into `.env`.

- [ ] **Step 3: Commit package files**

```bash
cd backend && git add package.json package-lock.json && git commit -m "feat: install stripe SDK"
```

---

## Task 3: Backend — billing.service.ts

**Files:**
- Create: `backend/src/services/billing.service.ts`

- [ ] **Step 1: Create the file**

```typescript
// backend/src/services/billing.service.ts
import Stripe from "stripe";
import { prisma } from "../db/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
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
    select: { currency: true },
  });

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
      nextBillingDate = new Date(
        sub.current_period_end * 1000
      ).toISOString();
    } catch {
      // non-blocking
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `backend/`:
```bash
npx tsc --noEmit
```
Expected: no errors related to billing.service.ts.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/billing.service.ts && git commit -m "feat: add billing service with Stripe integration"
```

---

## Task 4: Backend — billing controller + routes

**Files:**
- Create: `backend/src/controllers/billing.controller.ts`
- Create: `backend/src/routes/billing.routes.ts`

- [ ] **Step 1: Create billing.controller.ts**

```typescript
// backend/src/controllers/billing.controller.ts
import { Request, Response } from "express";
import {
  createCheckoutSession,
  createPortalSession,
  updateSubscriptionQuantity,
  getBillingStatus,
  handleWebhookEvent,
} from "../services/billing.service";

export async function createCheckoutHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const url = await createCheckoutSession(businessId, frontendUrl);
    res.json({ url });
  } catch (err: any) {
    console.error("[billing] createCheckout error:", err);
    res.status(err.statusCode ?? 500).json({ error: err.message ?? "Error creating checkout" });
  }
}

export async function createPortalHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const url = await createPortalSession(businessId, frontendUrl);
    res.json({ url });
  } catch (err: any) {
    console.error("[billing] createPortal error:", err);
    res.status(err.statusCode ?? 500).json({ error: err.message ?? "Error creating portal" });
  }
}

export async function updateQuantityHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const { newActiveCount } = req.body as { newActiveCount: number };
    if (typeof newActiveCount !== "number" || newActiveCount < 1) {
      return res.status(400).json({ error: "newActiveCount must be a positive number" });
    }
    await updateSubscriptionQuantity(businessId, newActiveCount);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[billing] updateQuantity error:", err);
    res.status(err.statusCode ?? 500).json({ error: err.message ?? "Error updating subscription" });
  }
}

export async function billingStatusHandler(req: Request, res: Response) {
  try {
    const businessId = req.user!.businessId;
    const status = await getBillingStatus(businessId);
    res.json(status);
  } catch (err: any) {
    console.error("[billing] status error:", err);
    res.status(500).json({ error: "Error fetching billing status" });
  }
}

export async function webhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature" });

  try {
    await handleWebhookEvent(req.body as Buffer, sig);
    res.json({ received: true });
  } catch (err: any) {
    console.error("[billing] webhook error:", err.message);
    res.status(400).json({ error: err.message });
  }
}
```

- [ ] **Step 2: Create billing.routes.ts**

This file is for authenticated billing routes (no subscription check). The webhook is handled separately in app.ts.

```typescript
// backend/src/routes/billing.routes.ts
import { Router } from "express";
import {
  createCheckoutHandler,
  createPortalHandler,
  updateQuantityHandler,
  billingStatusHandler,
} from "../controllers/billing.controller";

const router = Router();

router.post("/create-checkout", createCheckoutHandler);
router.post("/create-portal", createPortalHandler);
router.post("/update-quantity", updateQuantityHandler);
router.get("/status", billingStatusHandler);

export default router;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/billing.controller.ts backend/src/routes/billing.routes.ts && git commit -m "feat: add billing controller and routes"
```

---

## Task 5: Backend — webhook route in app.ts + requireSubscription middleware

**Files:**
- Modify: `backend/src/app.ts`
- Create: `backend/src/middleware/requireSubscription.ts`

- [ ] **Step 1: Add raw-body webhook route in app.ts**

The Stripe webhook requires the raw (unparsed) request body for signature verification. It must be registered BEFORE `express.json()`.

Edit `backend/src/app.ts` — add the webhook import and register the route before `app.use(express.json())`:

```typescript
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./db/prisma";
import authRoutes from "./routes/auth.routes";
import publicRoutes from "./routes/public.routes";
import routes from "./routes";
import { authLimiter, publicLimiter, apiLimiter } from "./middleware/rateLimiter";
import { webhookHandler } from "./controllers/billing.controller";

const app = express();

app.set("trust proxy", 1);

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Stripe webhook needs raw body — must be BEFORE express.json()
app.post("/billing/webhook", express.raw({ type: "application/json" }), webhookHandler);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "lumina-api" });
});

app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, db: "error" });
  }
});

app.use("/auth", authLimiter, authRoutes);
app.use("/booking", publicLimiter, publicRoutes);
app.use(apiLimiter, routes);

export default app;
```

- [ ] **Step 2: Create requireSubscription.ts**

```typescript
// backend/src/middleware/requireSubscription.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";

export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return next(); // authenticate runs first and would reject already

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        billingExempt: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });

    if (!business) return res.status(401).json({ error: "Business not found" });

    // Exempt businesses always pass
    if (business.billingExempt) return next();

    // Active subscription passes
    if (business.subscriptionStatus === "ACTIVE") return next();

    // Valid trial passes
    if (
      business.subscriptionStatus === "TRIAL" &&
      business.trialEndsAt &&
      business.trialEndsAt > new Date()
    ) {
      return next();
    }

    // Everything else is blocked
    return res.status(402).json({ error: "SUBSCRIPTION_REQUIRED" });
  } catch (err) {
    console.error("[requireSubscription] error:", err);
    return next(); // fail open to avoid blocking on DB errors
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.ts backend/src/middleware/requireSubscription.ts && git commit -m "feat: add Stripe webhook route and requireSubscription middleware"
```

---

## Task 6: Backend — register billing routes + apply subscription middleware

**Files:**
- Modify: `backend/src/routes/index.ts`

- [ ] **Step 1: Update routes/index.ts**

```typescript
import { Router } from "express";
import appointmentsRoutes from "./appointments.routes";
import agendaRoutes from "./agenda.routes";
import professionalRoutes from "./professionals.routes";
import clientsRoutes from "./clients.routes";
import servicesRoutes from "./services.routes";
import businessRoutes from "./business.routes";
import analyticsRoutes from "./analytics.routes";
import billingRoutes from "./billing.routes";
import { authenticate } from "../middleware/authenticate";
import { requireSubscription } from "../middleware/requireSubscription";
import { changePasswordHandler, updateUserHandler } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { changePasswordBody, updateUserBody } from "../validators";

const router = Router();

router.use(authenticate);

// Billing routes: authenticated but NOT gated by subscription (user needs to pay here)
router.use("/billing", billingRoutes);

// Auth profile routes: also not gated
router.post("/auth/change-password", validate(changePasswordBody), changePasswordHandler);
router.patch("/auth/me", validate(updateUserBody), updateUserHandler);

// All other routes require active subscription
router.use(requireSubscription);

router.use("/appointments", appointmentsRoutes);
router.use("/agenda", agendaRoutes);
router.use("/professionals", professionalRoutes);
router.use("/clients", clientsRoutes);
router.use("/services", servicesRoutes);
router.use("/business", businessRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/index.ts && git commit -m "feat: register billing routes and apply subscription middleware"
```

---

## Task 7: Backend — set trialEndsAt on business creation

**Files:**
- Modify: `backend/src/services/auth.service.ts`

- [ ] **Step 1: Update prisma.business.create call**

Find the `prisma.business.create` call (around line 96). Change:
```typescript
const business = await prisma.business.create({
  data: { name: businessName, slug: normalizedSlug, ...(timezone ? { timezone } : {}) },
});
```

To:
```typescript
const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const business = await prisma.business.create({
  data: {
    name: businessName,
    slug: normalizedSlug,
    trialEndsAt,
    ...(timezone ? { timezone } : {}),
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/auth.service.ts && git commit -m "feat: set trialEndsAt on business creation"
```

---

## Task 8: Frontend — update Business type + create billing.api.ts

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Create: `frontend/src/services/billing.api.ts`

- [ ] **Step 1: Extend Business type in entities.ts**

Find the `Business` type and add the new fields:

```typescript
export type Business = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  plan: "STARTER" | "PRO";
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  createdAt: string;
  trialEndsAt?: string | null;
  currency?: string | null;
  billingExempt?: boolean | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  mpAccessToken?: string | null;
  waPhoneNumberId?: string | null;
  waAccessToken?: string | null;
  waReminderHours?: number | null;
  emailNotificationsEnabled?: boolean | null;
  emailReminderHours?: number | null;
};
```

- [ ] **Step 2: Create billing.api.ts**

```typescript
// frontend/src/services/billing.api.ts
import { apiFetch } from "./api";

export function createCheckoutSession() {
  return apiFetch<{ url: string }>("/billing/create-checkout", { method: "POST" });
}

export function createPortalSession() {
  return apiFetch<{ url: string }>("/billing/create-portal", { method: "POST" });
}

export function updateSubscriptionQuantity(newActiveCount: number) {
  return apiFetch<{ ok: boolean }>("/billing/update-quantity", {
    method: "POST",
    body: JSON.stringify({ newActiveCount }),
  });
}

export type BillingStatus = {
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  plan: "STARTER" | "PRO";
  trialEndsAt: string | null;
  currency: string;
  billingExempt: boolean;
  nextBillingDate: string | null;
  activeProCount: number;
  totalMonthly: number;
  extraPriceAmount: number;
  basePriceAmount: number;
};

export function getBillingStatus() {
  return apiFetch<BillingStatus>("/billing/status");
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/entities.ts frontend/src/services/billing.api.ts && git commit -m "feat: extend Business type and add billing API service"
```

---

## Task 9: Frontend — SubscriptionGate component

**Files:**
- Create: `frontend/src/components/billing/SubscriptionGate.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/billing/SubscriptionGate.tsx
import { useState } from "react";
import { CreditCard, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useBusiness } from "../../hooks/useBusiness";
import { createCheckoutSession } from "../../services/billing.api";

function isBlocked(
  status: string,
  trialEndsAt: string | null | undefined,
  billingExempt: boolean | null | undefined
): boolean {
  if (billingExempt) return false;
  if (status === "ACTIVE") return false;
  if (status === "TRIAL" && trialEndsAt && new Date(trialEndsAt) > new Date()) return false;
  return true;
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "USD") return `$${amount} USD`;
  return `$${amount.toLocaleString("es-AR")} ARS`;
}

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useBusiness();
  const [redirecting, setRedirecting] = useState(false);

  if (isLoading) return <>{children}</>;

  const business = data?.business;
  if (!business) return <>{children}</>;

  const blocked = isBlocked(
    business.subscriptionStatus,
    business.trialEndsAt,
    business.billingExempt
  );

  if (!blocked) return <>{children}</>;

  const currency = business.currency ?? "ARS";
  const basePrice = currency === "USD" ? 18 : 16000;
  const extraPrice = currency === "USD" ? 7 : 7000;

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  return (
    <>
      {children}
      {/* Fullscreen overlay — not closeable */}
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-8 py-6 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold">Tu período de prueba ha vencido</h2>
            <p className="text-teal-100 text-sm mt-1">Suscribite para continuar usando Caleio</p>
          </div>

          {/* Plan details */}
          <div className="px-8 py-6">
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Plan Starter</span>
                <span className="text-lg font-bold text-teal-700">
                  {formatPrice(basePrice, currency)}<span className="text-sm font-normal text-slate-400">/mes</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                +{formatPrice(extraPrice, currency)}/mes por cada profesional extra (más de 2)
              </p>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                "Hasta 2 profesionales incluidos",
                "Agenda diaria y semanal",
                "Gestión de clientes y servicios",
                "Notificaciones por email",
                "Reservas online con link propio",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={redirecting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                "Suscribirme ahora"
              )}
            </button>

            <div className="mt-4 text-center">
              <a
                href="https://wa.me/5491112345678?text=Hola%2C%20tengo%20una%20consulta%20sobre%20Caleio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Hablar con soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Note:** Replace `5491112345678` in the WhatsApp link with your actual WhatsApp number.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/billing/SubscriptionGate.tsx && git commit -m "feat: add SubscriptionGate fullscreen blocking modal"
```

---

## Task 10: Frontend — TrialBanner component

**Files:**
- Create: `frontend/src/components/billing/TrialBanner.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/billing/TrialBanner.tsx
import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useBusiness } from "../../hooks/useBusiness";
import { createCheckoutSession } from "../../services/billing.api";
import { differenceInDays, parseISO } from "date-fns";

export default function TrialBanner() {
  const { data } = useBusiness();
  const [dismissed, setDismissed] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const business = data?.business;
  if (!business) return null;

  // Only show for TRIAL status with trialEndsAt set
  if (business.subscriptionStatus !== "TRIAL" || !business.trialEndsAt) return null;

  const daysLeft = differenceInDays(parseISO(business.trialEndsAt), new Date());

  // Show banner only on days 13 and 14 (daysLeft = 1 or 0 remaining after today)
  // differenceInDays gives days until expiry: show when <= 1 day left
  if (daysLeft > 1 || daysLeft < 0) return null;
  if (dismissed) return null;

  async function handleSubscribe() {
    setRedirecting(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  const message =
    daysLeft <= 0
      ? "Tu período de prueba vence hoy."
      : "Tu período de prueba vence mañana.";

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        {message}{" "}
        <button
          onClick={handleSubscribe}
          disabled={redirecting}
          className="font-semibold underline hover:no-underline inline-flex items-center gap-1"
        >
          {redirecting ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Redirigiendo...</>
          ) : (
            "Suscribite para no perder el acceso."
          )}
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-700 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/billing/TrialBanner.tsx && git commit -m "feat: add TrialBanner warning for trial expiry days 13-14"
```

---

## Task 11: Frontend — wire SubscriptionGate + TrialBanner into app

**Files:**
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/components/layout/Layout.tsx` (add TrialBanner above content)

- [ ] **Step 1: Check Layout structure**

Read `frontend/src/components/layout/Layout.tsx` to understand where the main content area is rendered.

- [ ] **Step 2: Add TrialBanner to Layout**

In `Layout.tsx`, import `TrialBanner` and render it above the main content area (below the top navbar if one exists, or at the very top of the content section):

```tsx
import TrialBanner from "../billing/TrialBanner";

// Inside the Layout return, add TrialBanner as the first element inside the main content wrapper:
<TrialBanner />
```

The exact placement depends on Layout structure — it should appear at the top of the page content area, below any fixed navigation.

- [ ] **Step 3: Wrap ProtectedRoute children with SubscriptionGate in router.tsx**

In `frontend/src/app/router.tsx`, import SubscriptionGate and wrap the protected content:

```tsx
import SubscriptionGate from "../components/billing/SubscriptionGate";

function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const slug = localStorage.getItem("lastSlug");
    return <Navigate to={slug ? `/login/${slug}` : "/login"} replace />;
  }

  return (
    <SubscriptionGate>
      <Outlet />
    </SubscriptionGate>
  );
}
```

- [ ] **Step 4: Handle billing=success redirect**

In `BusinessSettingsPage.tsx`, add a useEffect at the top of the component to detect the `?billing=success` query param and show a success toast/message:

```tsx
import { useSearchParams } from "react-router-dom";

// inside the component:
const [searchParams, setSearchParams] = useSearchParams();
useEffect(() => {
  if (searchParams.get("billing") === "success") {
    // clear the param and show success feedback (use existing toast/notification pattern in the project)
    setSearchParams({}, { replace: true });
    // show success message — adapt to existing UI pattern
  }
}, [searchParams, setSearchParams]);
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/router.tsx frontend/src/components/layout/Layout.tsx frontend/src/pages/BusinessSettingsPage.tsx && git commit -m "feat: wire SubscriptionGate and TrialBanner into app"
```

---

## Task 12: Frontend — Settings billing section

**Files:**
- Modify: `frontend/src/pages/BusinessSettingsPage.tsx`

- [ ] **Step 1: Add useBillingStatus hook usage + import**

At the top of `BusinessSettingsPage.tsx`, import the billing API and add a query:

```tsx
import { useQuery } from "@tanstack/react-query";
import { getBillingStatus, createPortalSession, type BillingStatus } from "../services/billing.api";
import { CreditCard } from "lucide-react"; // already imported or add it

// Inside the component, add:
const { data: billingData } = useQuery({
  queryKey: ["billingStatus"],
  queryFn: getBillingStatus,
});
```

- [ ] **Step 2: Add BillingSection component inside the file**

Add this component before the `export default` function (or as a nested function inside it, following the existing pattern of the file):

```tsx
function BillingSection({ billing }: { billing: BillingStatus | undefined }) {
  const [redirecting, setRedirecting] = useState(false);
  const { data: businessData } = useBusiness();
  const currency = businessData?.business?.currency ?? "ARS";

  function formatPrice(amount: number) {
    if (currency === "USD") return `$${amount} USD`;
    return `$${amount.toLocaleString("es-AR")} ARS`;
  }

  const BILLING_STATUS_LABELS: Record<string, string> = {
    TRIAL: "Período de prueba",
    ACTIVE: "Activo",
    PAST_DUE: "Pago vencido",
    CANCELED: "Cancelado",
  };

  const BILLING_STATUS_COLORS: Record<string, string> = {
    TRIAL: "bg-amber-50 text-amber-700",
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PAST_DUE: "bg-red-50 text-red-700",
    CANCELED: "bg-slate-100 text-slate-600",
  };

  async function handlePortal() {
    setRedirecting(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      setRedirecting(false);
    }
  }

  const status = billing?.subscriptionStatus ?? "TRIAL";
  const label = BILLING_STATUS_LABELS[status] ?? status;
  const colorClass = BILLING_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
        <CreditCard className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700">Suscripción</h2>
        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {label}
        </span>
      </div>
      <div className="px-6 py-4 space-y-3">
        {billing && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-700">Starter</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total mensual</span>
              <span className="font-medium text-slate-700">
                {formatPrice(billing.totalMonthly)}
              </span>
            </div>
            {billing.nextBillingDate && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Próximo cobro</span>
                <span className="font-medium text-slate-700">
                  {new Date(billing.nextBillingDate).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}
            {status === "ACTIVE" && (
              <button
                onClick={handlePortal}
                disabled={redirecting}
                className="mt-2 w-full text-sm text-teal-700 hover:text-teal-800 border border-teal-200 hover:bg-teal-50 rounded-lg py-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {redirecting ? "Redirigiendo..." : "Administrar suscripción"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Render BillingSection in the page**

Find where other sections are rendered in the return JSX (after the existing sections like WhatsApp, Email, etc.) and add:

```tsx
<BillingSection billing={billingData} />
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/BusinessSettingsPage.tsx && git commit -m "feat: add billing section to business settings"
```

---

## Task 13: Frontend — Professional extra confirmation modal

**Files:**
- Modify: `frontend/src/components/professionals/ProfessionalDetailModal.tsx`

- [ ] **Step 1: Add billing imports and state**

At the top of `ProfessionalDetailModal.tsx`, add:

```tsx
import { updateSubscriptionQuantity } from "../../services/billing.api";
import { useBusiness } from "../../hooks/useBusiness";
```

Inside the component, add state for the billing confirmation:

```tsx
const { data: businessData } = useBusiness();
const [showBillingConfirm, setShowBillingConfirm] = useState(false);
const [billingConfirmLoading, setBillingConfirmLoading] = useState(false);
const [billingConfirmError, setBillingConfirmError] = useState<string | null>(null);
```

- [ ] **Step 2: Add billing check before save**

The component has a "Guardar" button that calls a save function. Find that save function (it calls `updateProfessional` with `{ name, color, active }`). Wrap the save logic to check if activating an extra professional requires billing confirmation.

Find the existing save handler (look for where `active` is passed to the update call). Modify the flow:

```tsx
// In the save handler, BEFORE calling the actual update API:
// Check if we're activating a professional that would exceed the free tier
const activeProfessionalsCount = professionalsData?.professionals?.filter(
  (p: Professional) => p.active
).length ?? 0;

const isActivating = active === true && professional?.active === false;
const wouldExceedFree = activeProfessionalsCount >= 2;
const hasActiveSubscription = businessData?.business?.subscriptionStatus === "ACTIVE";

if (isActivating && wouldExceedFree && hasActiveSubscription) {
  setShowBillingConfirm(true);
  return; // don't save yet
}

// Otherwise proceed with normal save
```

Note: you'll need to import `useProfessionals` if not already imported in this file:
```tsx
import { useProfessionals } from "../../hooks/useProfessionals";
// and inside the component:
const { data: professionalsData } = useProfessionals();
```

- [ ] **Step 3: Add billing confirmation modal JSX**

Add this modal inside the component's return, alongside the existing modal content (rendered conditionally):

```tsx
{showBillingConfirm && (() => {
  const currency = businessData?.business?.currency ?? "ARS";
  const basePrice = currency === "USD" ? 18 : 16000;
  const extraPrice = currency === "USD" ? 7 : 7000;
  const currentActivePros = professionalsData?.professionals?.filter(
    (p: Professional) => p.active
  ).length ?? 0;
  const newCount = currentActivePros + 1;
  const extraCount = Math.max(0, newCount - 2);
  const totalMonthly = basePrice + extraCount * extraPrice;
  const formatPrice = (n: number) =>
    currency === "USD" ? `$${n} USD` : `$${n.toLocaleString("es-AR")} ARS`;

  async function handleConfirmBilling() {
    setBillingConfirmLoading(true);
    setBillingConfirmError(null);
    try {
      await updateSubscriptionQuantity(newCount);
      setShowBillingConfirm(false);
      // Now proceed with the actual professional save
      // Call the existing save logic here (extract it to a function named `doSave`)
      await doSave();
    } catch (err: any) {
      setBillingConfirmError(err?.message ?? "Error al actualizar la suscripción");
    } finally {
      setBillingConfirmLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2">Profesional adicional</h3>
        <p className="text-sm text-slate-600 mb-4">
          Tenés <strong>{currentActivePros}</strong> profesionales activos. Al activar este,
          tu plan pasa a <strong>{formatPrice(totalMonthly)}/mes</strong> (base{" "}
          {formatPrice(basePrice)} + {extraCount} extra × {formatPrice(extraPrice)}).
        </p>
        {billingConfirmError && (
          <p className="text-xs text-red-600 mb-3">{billingConfirmError}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setShowBillingConfirm(false); setBillingConfirmError(null); }}
            className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            disabled={billingConfirmLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmBilling}
            disabled={billingConfirmLoading}
            className="flex-1 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
          >
            {billingConfirmLoading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
})()}
```

**Important:** Extract the actual professional update API call into a `doSave` function so it can be called both from the normal save path and from `handleConfirmBilling`. The pattern is to wrap the existing save logic:

```tsx
async function doSave() {
  // existing save logic that calls updateProfessional(...)
}

async function handleSave() {
  // billing check (as above) → if needed, show confirm modal and return early
  // otherwise:
  await doSave();
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/professionals/ProfessionalDetailModal.tsx && git commit -m "feat: add billing confirmation when activating extra professional"
```

---

## Task 14: Final build verification + push

- [ ] **Step 1: Build backend**

```bash
cd backend && npm run build
```
Expected: no TypeScript errors, `dist/` folder created.

- [ ] **Step 2: Build frontend**

```bash
cd frontend && npm run build
```
Expected: no TypeScript errors, `dist/` folder created.

- [ ] **Step 3: Reset local DB and test trial flow manually**

```bash
cd backend && npx prisma migrate reset --force && npm run seed
```

Start the app and verify:
- Business starts with `subscriptionStatus = TRIAL` and `trialEndsAt = now + 14 days`
- The app loads normally (no blocking modal)
- No banner appears (trial is fresh, not days 13–14)

To test the blocking modal, temporarily set `trialEndsAt` to a past date in the DB:
```sql
UPDATE "Business" SET "trialEndsAt" = NOW() - INTERVAL '1 day' WHERE slug = 'lumina';
```
Refresh the app — the blocking modal should appear.

- [ ] **Step 4: Push to main**

```bash
git push origin main
```

---

## Environment Variables Checklist for Production (Railway)

Add these in Railway dashboard before testing payments:
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASE_ARS=price_...
STRIPE_PRICE_ID_BASE_USD=price_...
STRIPE_PRICE_ID_EXTRA_ARS=price_...
STRIPE_PRICE_ID_EXTRA_USD=price_...
FRONTEND_URL=https://tu-dominio.com
```

To get the webhook secret: in Stripe Dashboard → Developers → Webhooks → Add endpoint → enter `https://tu-api.railway.app/billing/webhook` → select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
