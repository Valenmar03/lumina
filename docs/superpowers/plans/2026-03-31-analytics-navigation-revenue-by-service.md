# Analytics: Period Navigation + Revenue by Service — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow navigating back/forward between weeks and months in the Analytics page, and add a "Ingresos por servicio" chart.

**Architecture:** Add an optional `refDate` (yyyy-MM-dd) query param to the analytics endpoint so the backend computes ranges relative to any date, not just today. The frontend manages a `refDate` state and renders nav arrows + a period label. A new `revenueByService` field is added to the response and rendered as a progress-bar card.

**Tech Stack:** TypeScript, Express, Prisma, React, React Query, TailwindCSS v4, Recharts

---

## Files

| File | Change |
|------|--------|
| `backend/src/validators/index.ts` | Add `refDate` optional field to `analyticsQuery` |
| `backend/src/services/analytics.service.ts` | Accept `refDate`, thread through `getDateRange`, add `revenueByService` |
| `backend/src/controllers/analytics.controller.ts` | Extract `refDate` from query, pass to service |
| `frontend/src/types/entities.ts` | Add `revenueByService` to `AnalyticsResponse` |
| `frontend/src/services/analytics.api.ts` | Accept and send `refDate` param |
| `frontend/src/hooks/useAnalytics.ts` | Accept `refDate`, include in query key |
| `frontend/src/pages/AnalyticsPage.tsx` | Add `refDate` state, nav arrows, period label, revenueByService card |

---

## Task 1 — Backend: accept `refDate` param

**Files:**
- Modify: `backend/src/validators/index.ts`
- Modify: `backend/src/services/analytics.service.ts`
- Modify: `backend/src/controllers/analytics.controller.ts`

- [ ] **Step 1: Add `refDate` to the validator**

In `backend/src/validators/index.ts`, find `analyticsQuery` (currently around line 297) and replace it:

```typescript
export const analyticsQuery = z.object({
  period: z.enum(["day", "week", "month", "year"]).optional(),
  refDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

- [ ] **Step 2: Update `getDateRange` to accept a reference date**

In `backend/src/services/analytics.service.ts`, replace the `getDateRange` function:

```typescript
function getDateRange(period: "week" | "month", refDate?: string): { from: Date; to: Date } {
  const ref = refDate ? new Date(refDate + "T12:00:00") : new Date();
  if (period === "week") {
    const day = ref.getDay();
    const from = new Date(ref);
    from.setDate(ref.getDate() - ((day + 6) % 7));
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  } else {
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }
}
```

- [ ] **Step 3: Add `refDate` param to `getAnalytics` and `revenueByService` computation**

In `backend/src/services/analytics.service.ts`, update the `getAnalytics` method signature and add `revenueByService` before the `return` statement:

```typescript
async getAnalytics(businessId: string, period: "week" | "month", refDate?: string) {
  const { from, to } = getDateRange(period, refDate);
  // ... rest of existing code unchanged ...
```

Then add the `revenueByService` computation right before the `return {` statement:

```typescript
    // Revenue by service
    const revBySvc: Record<string, { name: string; revenue: number }> = {};
    completed.forEach((a) => {
      const svcId = a.service.id;
      if (!revBySvc[svcId])
        revBySvc[svcId] = { name: a.service.name, revenue: 0 };
      revBySvc[svcId].revenue += Number(a.totalPrice ?? 0);
    });
    const revenueByService = Object.values(revBySvc)
      .map((s) => ({ name: s.name, revenue: Math.round(s.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
```

And add `revenueByService` to the returned object:

```typescript
    return {
      // ... all existing fields ...
      revenueByService,
    };
```

- [ ] **Step 4: Update the controller to extract and pass `refDate`**

In `backend/src/controllers/analytics.controller.ts`, replace the handler body:

```typescript
export async function getAnalyticsHandler(req: Request, res: Response) {
  try {
    const { businessId, role } = req.user!;
    if (role !== "OWNER") {
      return res.status(403).json({ error: "Solo el owner puede ver el análisis" });
    }
    const period = req.query.period === "week" ? "week" : "month";
    const refDate = typeof req.query.refDate === "string" ? req.query.refDate : undefined;
    const data = await analyticsService.getAnalytics(businessId, period, refDate);
    return res.json(data);
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({ error: err?.message ?? "Server error" });
  }
}
```

- [ ] **Step 5: Verify backend starts without errors**

```bash
cd backend && npm run dev
```

Expected: server starts, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/validators/index.ts backend/src/services/analytics.service.ts backend/src/controllers/analytics.controller.ts
git commit -m "feat: add refDate param and revenueByService to analytics endpoint"
```

---

## Task 2 — Frontend: types, API, hook

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/services/analytics.api.ts`
- Modify: `frontend/src/hooks/useAnalytics.ts`

- [ ] **Step 1: Add `revenueByService` to `AnalyticsResponse` type**

In `frontend/src/types/entities.ts`, find the `AnalyticsResponse` type and add the new field:

```typescript
export type AnalyticsResponse = {
  period: "week" | "month";
  from: string;
  to: string;
  summary: {
    totalAppointments: number;
    completedAppointments: number;
    totalRevenue: number;
    averageTicket: number;
    cancellationRate: number;
    noShowRate: number;
  };
  revenueByDay: Array<{ date: string; revenue: number }>;
  appointmentsByDay: Array<{ date: string; count: number }>;
  topServices: Array<{ name: string; count: number; percentage: number }>;
  peakHours: Array<{ hour: string; count: number }>;
  topProfessionals: Array<{ id: string; name: string; color: string | null; count: number }>;
  revenueByProfessional: Array<{ id: string; name: string; color: string | null; revenue: number }>;
  revenueByPaymentMethod: Array<{ method: string; label: string; count: number; percentage: number }>;
  appointmentsByDayOfWeek: Array<{ day: string; count: number }>;
  revenueByService: Array<{ name: string; revenue: number }>;
};
```

- [ ] **Step 2: Update `getAnalytics` in the API service**

In `frontend/src/services/analytics.api.ts`, replace the function:

```typescript
export function getAnalytics(period: "week" | "month", refDate?: string) {
  const params = new URLSearchParams({ period });
  if (refDate) params.set("refDate", refDate);
  return apiFetch<AnalyticsResponse>(`/analytics?${params.toString()}`);
}
```

- [ ] **Step 3: Update `useAnalytics` hook**

In `frontend/src/hooks/useAnalytics.ts`, replace the entire file:

```typescript
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "../services/analytics.api";

export function useAnalytics(period: "week" | "month", refDate?: string) {
  return useQuery({
    queryKey: ["analytics", period, refDate ?? "current"],
    queryFn: () => getAnalytics(period, refDate),
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/entities.ts frontend/src/services/analytics.api.ts frontend/src/hooks/useAnalytics.ts
git commit -m "feat: thread refDate through analytics frontend types, API and hook"
```

---

## Task 3 — Frontend: navigation UI + revenueByService card

**Files:**
- Modify: `frontend/src/pages/AnalyticsPage.tsx`

- [ ] **Step 1: Add `refDate` state and navigation helpers**

In `AnalyticsPage.tsx`, replace the existing state/imports at the top of the component:

Add to imports:
```typescript
import { addWeeks, addMonths, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, DollarSign, TrendingUp, XCircle } from "lucide-react";
```

Replace the state block at the top of `AnalyticsPage`:
```typescript
const [period, setPeriod] = useState<Period>("month");
const [refDate, setRefDate] = useState<Date>(new Date());

const refDateStr = format(refDate, "yyyy-MM-dd");

const navigate = (direction: -1 | 1) => {
  setRefDate((prev) =>
    period === "week" ? addWeeks(prev, direction) : addMonths(prev, direction),
  );
};

const periodLabel = period === "week"
  ? `${format(startOfWeek(refDate, { weekStartsOn: 1 }), "d MMM", { locale: es })} – ${format(endOfWeek(refDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: es })}`
  : format(refDate, "MMMM yyyy", { locale: es });

const { data, isLoading } = useAnalytics(period, refDateStr);
```

Also reset `refDate` to today when the user switches period:
```typescript
const handlePeriodChange = (p: Period) => {
  setPeriod(p);
  setRefDate(new Date());
};
```

- [ ] **Step 2: Update the period selector buttons to use `handlePeriodChange`**

Find the period toggle buttons and update their `onClick`:

```tsx
{(["week", "month"] as Period[]).map((p) => (
  <button
    key={p}
    onClick={() => handlePeriodChange(p)}
    className={`px-4 py-2 text-sm font-medium transition-colors ${
      period === p
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-50"
    }`}
  >
    {p === "week" ? "Semana" : "Mes"}
  </button>
))}
```

- [ ] **Step 3: Add nav arrows and period label to the header**

Replace the existing header `<div>` that contains the period selector. The new header should have three parts: left (title + subtitle), center (← label →), right (period toggle):

```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
  <div>
    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Análisis</h1>
    <p className="text-sm text-slate-500 mt-0.5">Métricas del negocio</p>
  </div>

  <div className="flex items-center gap-2">
    <button
      onClick={() => navigate(-1)}
      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      aria-label="Período anterior"
    >
      <ChevronLeft className="w-4 h-4 text-slate-500" />
    </button>

    <span className="text-sm font-medium text-slate-700 capitalize min-w-36 text-center">
      {periodLabel}
    </span>

    <button
      onClick={() => navigate(1)}
      disabled={refDateStr >= format(new Date(), "yyyy-MM-dd")}
      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Período siguiente"
    >
      <ChevronRight className="w-4 h-4 text-slate-500" />
    </button>
  </div>

  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white self-start sm:self-auto">
    {(["week", "month"] as Period[]).map((p) => (
      <button
        key={p}
        onClick={() => handlePeriodChange(p)}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          period === p
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        {p === "week" ? "Semana" : "Mes"}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Add `revenueByService` data and max to the component**

After the existing data destructuring lines (where `revenueByProfessional`, `maxProRevenue` etc. are defined), add:

```typescript
const revenueByService = data?.revenueByService ?? [];
const maxSvcRevenue = revenueByService[0]?.revenue ?? 1;
```

- [ ] **Step 5: Add the "Ingresos por servicio" card**

In the "Charts row 3" grid (the `grid-cols-1 lg:grid-cols-3` div), add a new card after the "Ingresos por profesional" card:

```tsx
{/* Revenue by service */}
<div className="bg-white rounded-xl border border-slate-200 p-5">
  <h2 className="text-sm font-semibold text-slate-700 mb-4">Ingresos por servicio</h2>
  {revenueByService.length === 0 ? (
    <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
  ) : (
    <div className="space-y-4">
      {revenueByService.map((svc) => (
        <div key={svc.name} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-700 truncate">{svc.name}</span>
              <span className="text-sm font-semibold text-slate-800 ml-2 shrink-0">
                {formatCurrency(svc.revenue)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{
                  width: `${Math.round((svc.revenue / maxSvcRevenue) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 6: Verify in browser**

- Open Analytics page
- Check month/week toggle resets to current period
- Click ← to go to previous month/week — data should update
- Click → should be disabled when already on current period
- "Ingresos por servicio" card should appear in charts row 3

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/AnalyticsPage.tsx
git commit -m "feat: add period navigation and revenue by service chart to analytics"
```
