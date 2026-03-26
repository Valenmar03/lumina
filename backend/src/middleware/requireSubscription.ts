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
    if (!businessId) return next();

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
