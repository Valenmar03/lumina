import { Router } from "express";
import {
  createProfessionalHandler,
  getProfessionalsHandler,
  updateProfessionalHandler,
  getProfessionalSchedulesHandler,
  replaceProfessionalScheduleForDayHandler,
  getProfessionalServicesHandler,
  replaceProfessionalServicesHandler,
  getProfessionalAvailabilityHandler,
  createProfessionalAccountHandler,
  getProfessionalUnavailabilitiesHandler,
  createProfessionalUnavailabilityHandler,
  deleteProfessionalUnavailabilityHandler,
} from "../controllers/professionals.controller";

const router = Router();

router.get("/", getProfessionalsHandler);
router.post("/", createProfessionalHandler);
router.patch("/:id", updateProfessionalHandler);

router.get("/:id/schedules", getProfessionalSchedulesHandler);
router.put("/:id/schedules/:dayOfWeek", replaceProfessionalScheduleForDayHandler);

router.get("/:id/services", getProfessionalServicesHandler);
router.put("/:id/services", replaceProfessionalServicesHandler);

router.get("/:id/availability", getProfessionalAvailabilityHandler);
router.post("/:id/account", createProfessionalAccountHandler);

router.get("/:id/unavailabilities", getProfessionalUnavailabilitiesHandler);
router.post("/:id/unavailabilities", createProfessionalUnavailabilityHandler);
router.delete("/:id/unavailabilities/:unavailabilityId", deleteProfessionalUnavailabilityHandler);

export default router;