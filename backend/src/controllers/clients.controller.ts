import { Request, Response } from "express";
import { clientService } from "../services/clients.service";

export async function listClientsHandler(req: Request, res: Response) {
  try {
    const { search } = req.query;

    const clients = await clientService.listClients({
      search: search ? String(search) : undefined,
    });

    return res.json({ clients });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function getClientByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const client = await clientService.getClientById(String(id));

    return res.json({ client });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function createClientHandler(req: Request, res: Response) {
  try {
    const { fullName, phone, email, notes } = req.body;

    const client = await clientService.createClient({
      fullName,
      phone,
      ...(email !== undefined ? { email } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });

    return res.status(201).json({ client });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function updateClientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, phone, email, notes } = req.body;

    const client = await clientService.updateClient(String(id), {
      ...(fullName !== undefined ? { fullName } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });

    return res.json({ client });
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}

export async function deleteClientHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await clientService.deleteClient(String(id));

    return res.status(204).send();
  } catch (err: any) {
    return res.status(err?.status ?? 500).json({
      error: err?.message ?? "Server error",
    });
  }
}