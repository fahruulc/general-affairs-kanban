import { z } from "zod";

export const createCommentSchema = z.object({
  reportId: z.string().min(1, "ID laporan wajib disertakan."),
  body: z
    .string()
    .trim()
    .min(1, "Komentar tidak boleh kosong.")
    .max(1000, "Komentar maksimal 1000 karakter."),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
