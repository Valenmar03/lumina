import { Router } from "express";
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  getBusinessBySlugHandler,
  registerHandler
} from "../controllers/auth.controller";

const router = Router();

router.get("/business/:slug", getBusinessBySlugHandler);
router.post("/register", registerHandler); // disabled until public launch
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

export default router;
