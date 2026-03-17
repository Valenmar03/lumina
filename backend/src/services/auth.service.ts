import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { AuthPayload } from "../middleware/authenticate";

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function generateRawRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRawRefreshToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")   // remove non-alphanumeric
    .trim()
    .replace(/\s+/g, "-");           // spaces to hyphens
}

export type AuthUser = {
  id: string;
  email: string | null;
  username: string | null;
  role: "OWNER" | "PRO";
  businessId: string;
  professionalId?: string;
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

async function getProfessionalId(userId: string): Promise<string | undefined> {
  const pro = await prisma.professional.findUnique({ where: { userId } });
  return pro?.id;
}

export async function register(
  email: string,
  password: string,
  businessName: string,
  slug: string
): Promise<AuthResult> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw Object.assign(new Error("Invalid slug"), { statusCode: 400 });
  }

  const [existingEmail, existingSlug] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.business.findUnique({ where: { slug: normalizedSlug } }),
  ]);

  if (existingEmail) {
    throw Object.assign(new Error("Email already in use"), { statusCode: 409 });
  }
  if (existingSlug) {
    throw Object.assign(new Error("Business URL already taken"), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const business = await prisma.business.create({
    data: { name: businessName, slug: normalizedSlug },
  });

  const user = await prisma.user.create({
    data: { email, passwordHash, role: "OWNER", businessId: business.id },
  });

  const payload: AuthPayload = { userId: user.id, businessId: business.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, username: user.username, role: user.role, businessId: user.businessId },
  };
}

export async function login(
  slug: string,
  identifier: string,
  password: string
): Promise<AuthResult> {
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) {
    throw Object.assign(new Error("Business not found"), { statusCode: 404 });
  }

  // Find user by email (case-insensitive) or username within this business
  const normalizedIdentifier = identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      businessId: business.id,
      OR: [
        { email: { equals: normalizedIdentifier, mode: "insensitive" } },
        { username: identifier },
      ],
    },
  });

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const professionalId = await getProfessionalId(user.id);
  const payload: AuthPayload = { userId: user.id, businessId: user.businessId, role: user.role, professionalId };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, username: user.username, role: user.role, businessId: user.businessId, professionalId },
  };
}

export async function refresh(rawToken: string): Promise<AuthResult> {
  const tokenHash = hashToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error("Session expired"), { statusCode: 401 });
  }

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { tokenHash } });

  const { user } = stored;
  const professionalId = await getProfessionalId(user.id);
  const payload: AuthPayload = { userId: user.id, businessId: user.businessId, role: user.role, professionalId };
  const accessToken = generateAccessToken(payload);
  const newRawRefreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken: newRawRefreshToken,
    user: { id: user.id, email: user.email, username: user.username, role: user.role, businessId: user.businessId, professionalId },
  };
}

export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function getBusinessBySlug(slug: string): Promise<{ name: string; slug: string } | null> {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  return business;
}
