import { z } from "zod";
import { ReportCategory, ReportPriority, ReportStatus } from "@prisma/client";
import { APP_CONFIG } from "../constants";

export const createReportSchema = z.object({
  category: z.nativeEnum(ReportCategory, {
    message: "Kategori laporan wajib dipilih.",
  }),
  title: z
    .string()
    .trim()
    .min(5, "Judul laporan minimal 5 karakter.")
    .max(120, "Judul laporan maksimal 120 karakter."),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi laporan minimal 10 karakter.")
    .max(2000, "Deskripsi laporan maksimal 2000 karakter."),
  locationDetail: z
    .string()
    .trim()
    .min(3, "Lokasi laporan minimal 3 karakter.")
    .max(120, "Lokasi laporan maksimal 120 karakter."),
  priority: z.nativeEnum(ReportPriority).default(ReportPriority.MEDIUM),
  attachmentKeys: z
    .array(z.string())
    .min(1, "Minimal 1 foto bukti awal (BEFORE) wajib diunggah.")
    .max(APP_CONFIG.maxAttachmentsPerKind, `Maksimal ${APP_CONFIG.maxAttachmentsPerKind} foto bukti awal.`),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  category: z.nativeEnum(ReportCategory).optional(),
  title: z
    .string()
    .trim()
    .min(5, "Judul laporan minimal 5 karakter.")
    .max(120, "Judul laporan maksimal 120 karakter.")
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi laporan minimal 10 karakter.")
    .max(2000, "Deskripsi laporan maksimal 2000 karakter.")
    .optional(),
  locationDetail: z
    .string()
    .trim()
    .min(3, "Lokasi laporan minimal 3 karakter.")
    .max(120, "Lokasi laporan maksimal 120 karakter.")
    .optional(),
  priority: z.nativeEnum(ReportPriority).optional(),
  attachmentKeys: z
    .array(z.string())
    .max(APP_CONFIG.maxAttachmentsPerKind)
    .optional(),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

export const transitionReportSchema = z.object({
  toStatus: z.nativeEnum(ReportStatus, {
    message: "Status tujuan tidak valid.",
  }),
  note: z.string().trim().max(1000).optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
  resolutionNote: z.string().trim().max(1000).optional(),
  afterAttachmentKeys: z.array(z.string()).max(APP_CONFIG.maxAttachmentsPerKind).optional(),
});

export type TransitionReportInput = z.infer<typeof transitionReportSchema>;
