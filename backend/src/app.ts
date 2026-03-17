import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./db/prisma";
import authRoutes from "./routes/auth.routes";
import routes from "./routes";

const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:5173";
app.use(cors({ origin: allowedOrigin, credentials: true }));
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

app.use("/auth", authRoutes);
app.use(routes);

export default app;
