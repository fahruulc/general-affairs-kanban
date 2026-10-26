import { z } from "zod";
import { APP_CONFIG } from "../constants";

export const presignUploadSchema = z.object({
  fileName: z.string().min(1, "Nama file wajib ada."),
  contentType: z.string().refine((val) => APP_CONFIG.allowedMimeTypes.includes(val as any), {
    message: "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.",
  }),
  sizeBytes: z
    .number()
    .positive("Ukuran file tidak valid.")
    .max(APP_CONFIG.maxUploadBytes, `Ukuran file maksimal ${APP_CONFIG.maxUploadBytes / (1024 * 1024)} MB.`),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
