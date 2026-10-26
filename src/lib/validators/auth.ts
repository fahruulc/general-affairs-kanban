import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter.")
      .max(100, "Password terlalu panjang."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
