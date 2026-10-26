"use server";

import prisma from "../lib/db";
import { requireUser } from "./auth";
import { canViewReportDetail } from "../lib/permissions";
import { createPresignedDownloadUrl } from "../lib/s3";
import { UI_TEXT } from "../lib/constants";

/**
 * Generate a signed download URL for an attachment after authorizing user
 */
export async function getAttachmentDownloadUrl(attachmentId: string) {
  const user = await requireUser();

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      report: {
        select: { id: true, reporterId: true },
      },
    },
  });

  if (!attachment) {
    return { success: false, error: "Lampiran tidak ditemukan." };
  }

  // Authorize user access to report
  if (!canViewReportDetail(user, attachment.report)) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  const downloadUrl = await createPresignedDownloadUrl(attachment.objectKey);

  return {
    success: true,
    data: {
      downloadUrl,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
    },
  };
}
