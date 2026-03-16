import { Router } from "express";
import {
    createAppointmentHandler,
    getAppointmentsHandler,
    changeAppointmentStatusHandler,
    rescheduleAppointmentHandler,
    updateAppointmentHandler,
} from "../controllers/appointments.controller";


const router = Router();

router.post("/", createAppointmentHandler);
router.get("/", getAppointmentsHandler);
router.patch("/:id", updateAppointmentHandler);
router.patch("/:id/status", changeAppointmentStatusHandler);
router.patch("/:id/reschedule", rescheduleAppointmentHandler);

export default router;