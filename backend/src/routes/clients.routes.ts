import { Router } from "express";
import {
  createClientHandler,
  getClientByIdHandler,
  listClientsHandler,
  updateClientHandler,
  deleteClientHandler,
  getClientAppointmentsHandler
} from "../controllers/clients.controller";

const router = Router();

router.get("/", listClientsHandler);
router.get("/:id", getClientByIdHandler);
router.post("/", createClientHandler);
router.patch("/:id", updateClientHandler);
router.delete("/:id", deleteClientHandler);
router.get("/:id/appointments", getClientAppointmentsHandler);

export default router;