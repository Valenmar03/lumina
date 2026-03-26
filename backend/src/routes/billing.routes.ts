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
