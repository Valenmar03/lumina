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
