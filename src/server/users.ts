"use server";

import prisma from "../lib/db";
import { requireRole } from "./auth";
import {
  createUserSchema,
  CreateUserInput,
  updateUserSchema,
  UpdateUserInput,
} from "../lib/validators/users";
import {
  canDeactivateUser,
  canChangeUserRole,
} from "../lib/permissions";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { APP_CONFIG, UI_TEXT } from "../lib/constants";

/**
 * Helper to generate secure random temporary password
 */
function generateTemporaryPassword(length: number = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return password;
}

/**
 * 1. List users with search, role/status filter, and pagination (FR-USER-01)
 */
export async function listUsers(query: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
} = {}) {
  await requireRole([Role.ADMIN]);

  const page = Math.max(1, query.page || 1);
  const pageSize = query.pageSize || APP_CONFIG.defaultPageSize;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (query.role) where.role = query.role;
  if (typeof query.isActive === "boolean") where.isActive = query.isActive;

  if (query.search && query.search.trim().length > 0) {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { employeeNo: { contains: term, mode: "insensitive" } },
    ];
  }

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        employeeNo: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        phone: true,
        department: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    success: true,
    data: users,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

/**
 * 2. Create user (FR-USER-02)
 */
export async function createUser(input: CreateUserInput) {
  await requireRole([Role.ADMIN]);

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const { name, email, employeeNo, departmentId, phone, role } = parsed.data;

  // Check unique email
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { success: false, error: "Email sudah terdaftar." };
  }

  const tempPassword = generateTemporaryPassword(10);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      employeeNo: employeeNo || null,
      departmentId: departmentId || null,
      phone: phone || null,
      role,
      passwordHash,
      isActive: true,
      mustChangePassword: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employeeNo: true,
    },
  });

  return {
    success: true,
    data: newUser,
    temporaryPassword: tempPassword,
    message: UI_TEXT.userCreated,
  };
}

/**
 * 3. Update user (FR-USER-03)
 */
export async function updateUser(userId: string, input: UpdateUserInput) {
  const admin = await requireRole([Role.ADMIN]);

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!targetUser) {
    return { success: false, error: "Pengguna tidak ditemukan." };
  }

  // Admin cannot demote self
  if (parsed.data.role && !canChangeUserRole(admin, userId, parsed.data.role)) {
    return { success: false, error: UI_TEXT.cannotDemoteSelf };
  }

  // Ensure at least one active Admin remains
  if (
    targetUser.role === Role.ADMIN &&
    parsed.data.role &&
    parsed.data.role !== Role.ADMIN
  ) {
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, isActive: true },
    });
    if (activeAdminCount <= 1) {
      return { success: false, error: UI_TEXT.mustHaveActiveAdmin };
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      employeeNo: parsed.data.employeeNo,
      departmentId: parsed.data.departmentId,
      phone: parsed.data.phone,
      role: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employeeNo: true,
      phone: true,
      departmentId: true,
      isActive: true,
    },
  });

  return { success: true, data: updated, message: UI_TEXT.userUpdated };
}

/**
 * 4. Reset user password (FR-USER-04)
 */
export async function resetUserPassword(userId: string) {
  await requireRole([Role.ADMIN]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return { success: false, error: "Pengguna tidak ditemukan." };
  }

  const tempPassword = generateTemporaryPassword(10);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  return {
    success: true,
    temporaryPassword: tempPassword,
    message: UI_TEXT.passwordResetSuccess,
  };
}

/**
 * 5. Toggle user active status (FR-USER-05: Nonaktifkan & Aktifkan)
 */
export async function toggleUserActive(userId: string, isActive: boolean) {
  const admin = await requireRole([Role.ADMIN]);

  // Admin cannot deactivate self
  if (!isActive && !canDeactivateUser(admin, userId)) {
    return { success: false, error: UI_TEXT.cannotDeactivateSelf };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!targetUser) {
    return { success: false, error: "Pengguna tidak ditemukan." };
  }

  // Ensure at least one active Admin remains
  if (!isActive && targetUser.role === Role.ADMIN) {
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, isActive: true },
    });
    if (activeAdminCount <= 1) {
      return { success: false, error: UI_TEXT.mustHaveActiveAdmin };
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  return {
    success: true,
    data: updated,
    message: isActive ? "Pengguna berhasil diaktifkan." : "Pengguna berhasil dinonaktifkan.",
  };
}

/**
 * 6. Departments management (FR-USER-06)
 */
export async function getDepartments() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });
  return { success: true, data: departments };
}

export async function createDepartment(name: string) {
  await requireRole([Role.ADMIN]);
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { success: false, error: "Nama departemen minimal 2 karakter." };
  }

  const existing = await prisma.department.findUnique({
    where: { name: trimmed },
  });
  if (existing) {
    return { success: false, error: "Departemen dengan nama tersebut sudah ada." };
  }

  const dept = await prisma.department.create({
    data: { name: trimmed },
  });

  return { success: true, data: dept, message: "Departemen berhasil ditambahkan." };
}
