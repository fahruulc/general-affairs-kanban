"use server";

import { auth } from "../auth";
import prisma from "../lib/db";
import bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";
import { changePasswordSchema, ChangePasswordInput } from "../lib/validators/auth";
import { updateProfileSchema, UpdateProfileInput } from "../lib/validators/users";
import { UI_TEXT } from "../lib/constants";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  departmentId: string | null;
  phone: string | null;
}

/**
 * Strict database re-verification (Layer 2 of FR-AUTH-04).
 * Reads the latest user state directly from PostgreSQL, ensuring any role changes
 * or account deactivations take effect immediately.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      departmentId: true,
      phone: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(UI_TEXT.unauthorized);
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(UI_TEXT.unauthorized);
  }
  return user;
}

/**
 * Change password action (mandatory initial change or voluntary profile change)
 */
export async function changePasswordAction(input: ChangePasswordInput) {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  const isPasswordValid = await bcrypt.compare(
    parsed.data.currentPassword,
    dbUser.passwordHash
  );
  if (!isPasswordValid) {
    return { success: false, error: "Password saat ini salah." };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return {
    success: true,
    message: UI_TEXT.passwordChanged,
    email: dbUser.email,
    role: dbUser.role,
  };
}

/**
 * Update user's own profile (name, phone)
 */
export async function updateProfileAction(input: UpdateProfileInput) {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  return { success: true, data: updated };
}
