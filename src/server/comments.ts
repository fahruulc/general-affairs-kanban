"use server";

import prisma from "../lib/db";
import { requireUser } from "./auth";
import { createCommentSchema, CreateCommentInput } from "../lib/validators/comments";
import { canCommentOnReport } from "../lib/permissions";
import { UI_TEXT } from "../lib/constants";

/**
 * Add a comment to a report (FR-REP-07)
 */
export async function addComment(input: CreateCommentInput) {
  const user = await requireUser();

  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input komentar tidak valid.",
    };
  }

  const { reportId, body } = parsed.data;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, reporterId: true, status: true },
  });

  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  // RBAC check: Employee only on own reports
  if (!canCommentOnReport(user, report)) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  const comment = await prisma.comment.create({
    data: {
      reportId,
      body,
      authorId: user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return {
    success: true,
    data: comment,
    message: UI_TEXT.commentSent,
  };
}

/**
 * List comments for a report
 */
export async function listComments(reportId: string) {
  const user = await requireUser();

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, reporterId: true },
  });

  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  if (!canCommentOnReport(user, report)) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  const comments = await prisma.comment.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return { success: true, data: comments };
}
