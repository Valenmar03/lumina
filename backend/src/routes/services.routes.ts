import { Router } from "express";
import {
  getServicesHandler,
  getServiceByIdHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
  toggleServiceActiveHandler,
  getServicesWithProfessionalHandler,
} from "../controllers/services.controller";

const router = Router();

router.get("/", getServicesHandler);
router.get("/professionals", getServicesWithProfessionalHandler);
router.get("/:id", getServiceByIdHandler);
router.post("/", createServiceHandler);
router.patch("/:id", updateServiceHandler);
router.patch("/:id/active", toggleServiceActiveHandler);
router.delete("/:id", deleteServiceHandler);

export default router;