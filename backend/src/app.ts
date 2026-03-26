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
