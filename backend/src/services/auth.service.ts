import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { AuthPayload } from "../middleware/authenticate";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service";

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_DAYS = 30;
const EMAIL_VERIFICATION_EXPIRES_HOURS = 24;
const PASSWORD_RESET_EXPIRES_HOURS = 1;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function generateRawRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
  emailVerified: boolean;
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
  slug: string,
  timezone?: string
): Promise<{ user: AuthUser }> {
  const normalizedSlug = normalizeSlug(slug);
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedSlug) {
    throw Object.assign(new Error("Invalid slug"), { statusCode: 400 });
  }

  const [existingEmail, existingSlug] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail } }),
    prisma.business.findUnique({ where: { slug: normalizedSlug } }),
  ]);

  if (existingEmail) throw Object.assign(new Error("Email already in use"), { statusCode: 409 });
  if (existingSlug) throw Object.assign(new Error("Business URL already taken"), { statusCode: 409 });

  const passwordHash = await bcrypt.hash(password.trim(), 12);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug: normalizedSlug,
      trialEndsAt,
      ...(timezone ? { timezone } : {}),
    },
  });
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, role: "OWNER", businessId: business.id, emailVerified: false },
  });

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EMAIL_VERIFICATION_EXPIRES_HOURS);
  await prisma.emailVerification.create({ data: { userId: user.id, tokenHash, expiresAt } });
  await sendVerificationEmail(normalizedEmail, rawToken);

  return {
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, businessId: user.businessId, emailVerified: user.emailVerified,
    },
  };
}

export async function verifyEmail(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.emailVerification.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!record || record.expiresAt < new Date()) {
    throw Object.assign(new Error("Invalid or expired verification link"), { statusCode: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerification.delete({ where: { tokenHash } }),
  ]);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return; // Silently succeed to avoid leaking emails

  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRES_HOURS);
  await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } });
  await sendPasswordResetEmail(email.trim().toLowerCase(), rawToken);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash }, include: { user: true } });

  if (!record || record.expiresAt < new Date()) {
    throw Object.assign(new Error("Invalid or expired reset link"), { statusCode: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword.trim(), 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordReset.delete({ where: { tokenHash } }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);
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
  const normalizedIdentifier = identifier.trim().toLowerCase();
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

  const valid = await bcrypt.compare(password.trim(), user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  if (!user.emailVerified) {
    throw Object.assign(new Error("Email not verified"), { statusCode: 403 });
  }

  const professionalId = await getProfessionalId(user.id);
  const payload: AuthPayload = { userId: user.id, businessId: user.businessId, role: user.role, professionalId };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, businessId: user.businessId, professionalId, emailVerified: user.emailVerified,
    },
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
    user: {
      id: user.id, email: user.email, username: user.username,
      role: user.role, businessId: user.businessId, professionalId, emailVerified: user.emailVerified,
    },
  };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });

  const valid = await bcrypt.compare(currentPassword.trim(), user.passwordHash);
  if (!valid) throw Object.assign(new Error("Contraseña actual incorrecta"), { statusCode: 403 });

  const passwordHash = await bcrypt.hash(newPassword.trim(), 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
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
