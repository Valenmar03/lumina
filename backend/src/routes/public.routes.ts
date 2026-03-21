import { Router } from "express";
import {
  getBusinessInfoHandler,
  getServicesHandler,
  getProfessionalsHandler,
  getAvailabilityHandler,
  createAppointmentHandler,
  confirmPaymentHandler,
} from "../controllers/public.controller";
import { validate } from "../middleware/validate";
import {
  slugParams,
  publicAvailabilityParams,
  publicAvailabilityQuery,
  publicCreateAppointmentBody,
  confirmPaymentBody,
} from "../validators";

const router = Router();

router.get("/:slug/info", validate(slugParams, "params"), getBusinessInfoHandler);
router.get("/:slug/services", validate(slugParams, "params"), getServicesHandler);
router.get("/:slug/professionals", validate(slugParams, "params"), getProfessionalsHandler);
router.get(
  "/:slug/professionals/:professionalId/availability",
  validate(publicAvailabilityParams, "params"),
  validate(publicAvailabilityQuery, "query"),
  getAvailabilityHandler
);
router.post("/:slug/appointments", validate(slugParams, "params"), validate(publicCreateAppointmentBody), createAppointmentHandler);
router.post(
  "/:slug/appointments/:appointmentId/confirm-payment",
  validate(confirmPaymentBody),
  confirmPaymentHandler
);

export default router;
