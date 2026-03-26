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
