import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  email: z.string().trim().email("Format email tidak valid."),
  employeeNo: z
    .string()
    .trim()
    .max(50, "Nomor induk maksimal 50 karakter.")
    .optional()
    .nullable(),
  departmentId: z.string().optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  role: z.nativeEnum(Role, {
    message: "Peran pengguna wajib dipilih.",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter.")
    .optional(),
  employeeNo: z
    .string()
    .trim()
    .max(50, "Nomor induk maksimal 50 karakter.")
    .optional()
    .nullable(),
  departmentId: z.string().optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  phone: z.string().trim().max(20).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
