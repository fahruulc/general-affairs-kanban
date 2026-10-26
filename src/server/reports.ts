"use server";

import prisma from "../lib/db";
import { getCurrentUser, requireUser } from "./auth";
import {
  createReportSchema,
  CreateReportInput,
  updateReportSchema,
  UpdateReportInput,
  transitionReportSchema,
  TransitionReportInput,
} from "../lib/validators/reports";
import {
  canViewReportDetail,
  canEditReport,
  canClaimReport,
  canAssignReport,
  canViewKanban,
} from "../lib/permissions";
import { validateStatusTransition } from "../lib/status-machine";
import {
  isObjectKeyOwnedByUser,
  verifyObjectExists,
  createPresignedDownloadUrl,
} from "../lib/s3";
import {
  Role,
  ReportStatus,
  ReportCategory,
  ReportPriority,
  AttachmentKind,
} from "@prisma/client";
import { APP_CONFIG, UI_TEXT } from "../lib/constants";
import { formatReportNumber } from "../lib/format";

export interface ReportListQuery {
  page?: number;
  pageSize?: number;
  category?: ReportCategory;
  status?: ReportStatus;
  priority?: ReportPriority;
  assigneeId?: string;
  search?: string;
}

/**
 * 1. Create a new GA report (FR-REP-01)
 */
export async function createReport(input: CreateReportInput) {
  const user = await requireUser();

  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data laporan tidak valid.",
    };
  }

  const { category, title, description, locationDetail, priority, attachmentKeys } =
    parsed.data;

  // Verify attachment keys ownership and S3 existence
  const verifiedAttachments: {
    objectKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }[] = [];

  for (const key of attachmentKeys) {
    if (!isObjectKeyOwnedByUser(key, user.id)) {
      return {
        success: false,
        error: "Kunci lampiran tidak sah atau milik pengguna lain.",
      };
    }

    const metadata = await verifyObjectExists(key);
    if (!metadata) {
      return {
        success: false,
        error: `Foto ${key} belum terunggah ke penyimpanan.`,
      };
    }

    if (metadata.sizeBytes > APP_CONFIG.maxUploadBytes) {
      return {
        success: false,
        error: `Ukuran foto ${key} melebihi batas 5 MB.`,
      };
    }

    const fileName = key.split("/").pop() || "foto.jpg";
    verifiedAttachments.push({
      objectKey: key,
      fileName,
      mimeType: metadata.contentType || "image/jpeg",
      sizeBytes: metadata.sizeBytes,
    });
  }

  // Create report, attachments, and initial status log in a single transaction
  const createdReport = await prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        title,
        description,
        category,
        priority,
        status: ReportStatus.NEW,
        locationDetail,
        reporterId: user.id,
        attachments: {
          create: verifiedAttachments.map((att) => ({
            kind: AttachmentKind.BEFORE,
            objectKey: att.objectKey,
            fileName: att.fileName,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
            uploadedById: user.id,
          })),
        },
        statusLogs: {
          create: {
            fromStatus: null,
            toStatus: ReportStatus.NEW,
            note: "Laporan baru dibuat oleh pelapor.",
            actorId: user.id,
          },
        },
      },
      include: {
        attachments: true,
      },
    });

    return report;
  });

  return {
    success: true,
    data: {
      ...createdReport,
      formattedNumber: formatReportNumber(createdReport.number),
    },
    message: UI_TEXT.reportCreated,
  };
}

/**
 * 2. Get list of reports with search, filter, and pagination (FR-REP-02)
 */
export async function getReportsList(query: ReportListQuery = {}) {
  const user = await requireUser();
  const page = Math.max(1, query.page || 1);
  const pageSize = query.pageSize || APP_CONFIG.defaultPageSize;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  // Strict RBAC: Employee only sees their own reports
  if (user.role === Role.EMPLOYEE) {
    where.reporterId = user.id;
  }

  if (query.category) where.category = query.category;
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assigneeId) where.assigneeId = query.assigneeId;

  if (query.search && query.search.trim().length > 0) {
    const term = query.search.trim();
    // Check if search term is numeric or formatted report number (GA-00001)
    const numericMatch = term.match(/(?:GA-)?0*(\d+)/i);
    const parsedNumber = numericMatch ? parseInt(numericMatch[1], 10) : null;

    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { locationDetail: { contains: term, mode: "insensitive" } },
      ...(parsedNumber ? [{ number: parsedNumber }] : []),
    ];
  }

  const [totalCount, items] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { attachments: true, comments: true },
        },
      },
    }),
  ]);

  return {
    success: true,
    data: items.map((r) => ({
      ...r,
      formattedNumber: formatReportNumber(r.number),
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}

/**
 * 3. Get single report detail with signed attachment URLs (FR-REP-03)
 */
export async function getReportById(reportId: string) {
  const user = await requireUser();

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: { select: { id: true, name: true } },
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
      },
      statusLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  // RBAC check: Employee cannot view other users' reports
  if (!canViewReportDetail(user, report)) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  // Generate signed GET URLs for all attachments
  const attachmentsWithUrls = await Promise.all(
    report.attachments.map(async (att) => {
      try {
        const signedUrl = await createPresignedDownloadUrl(att.objectKey);
        return {
          ...att,
          signedUrl,
        };
      } catch (err) {
        console.error(`Error generating download URL for ${att.objectKey}:`, err);
        return {
          ...att,
          signedUrl: null,
        };
      }
    })
  );

  return {
    success: true,
    data: {
      ...report,
      formattedNumber: formatReportNumber(report.number),
      attachments: attachmentsWithUrls,
    },
  };
}

/**
 * 4. Update report content (FR-REP-04)
 */
export async function updateReport(reportId: string, input: UpdateReportInput) {
  const user = await requireUser();

  const existing = await prisma.report.findUnique({
    where: { id: reportId },
    include: { attachments: true },
  });

  if (!existing) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  if (!canEditReport(user, existing)) {
    return {
      success: false,
      error: "Anda tidak memiliki hak untuk mengubah laporan ini.",
    };
  }

  const parsed = updateReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      locationDetail: parsed.data.locationDetail,
      category: parsed.data.category,
      priority: parsed.data.priority,
    },
  });

  return {
    success: true,
    data: {
      ...updated,
      formattedNumber: formatReportNumber(updated.number),
    },
    message: UI_TEXT.reportUpdated,
  };
}

/**
 * 5. Claim report by Officer or Admin (FR-REP-05)
 */
export async function claimReport(reportId: string) {
  const user = await requireUser();

  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  if (!canClaimReport(user, report)) {
    return {
      success: false,
      error: "Laporan tidak dapat diambil atau Anda tidak memiliki akses.",
    };
  }

  const transitionCheck = validateStatusTransition(
    report.status,
    ReportStatus.IN_PROGRESS,
    {
      actor: user,
      report: {
        assigneeId: report.assigneeId,
        afterAttachmentCount: 0,
        startedAt: report.startedAt,
      },
      note: `Laporan diambil oleh ${user.name}.`,
    }
  );

  if (!transitionCheck.allowed) {
    return { success: false, error: transitionCheck.error };
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.IN_PROGRESS,
        assigneeId: user.id,
        startedAt: report.startedAt || now,
      },
    });

    await tx.reportStatusLog.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus: ReportStatus.IN_PROGRESS,
        note: `Laporan diambil oleh ${user.name}.`,
        actorId: user.id,
      },
    });
  });

  return { success: true, message: UI_TEXT.reportClaimed };
}

/**
 * 6. Assign report to an officer (Admin only, FR-REP-06)
 */
export async function assignReport(reportId: string, assigneeId: string) {
  const user = await requireUser();

  if (!canAssignReport(user)) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  const [report, targetOfficer] = await Promise.all([
    prisma.report.findUnique({ where: { id: reportId } }),
    prisma.user.findUnique({ where: { id: assigneeId } }),
  ]);

  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }
  if (!targetOfficer || !targetOfficer.isActive || targetOfficer.role === Role.EMPLOYEE) {
    return {
      success: false,
      error: "Petugas yang dipilih tidak valid atau tidak aktif.",
    };
  }

  const shouldMoveToInProgress = report.status === ReportStatus.NEW;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: {
        assigneeId: targetOfficer.id,
        ...(shouldMoveToInProgress
          ? {
              status: ReportStatus.IN_PROGRESS,
              startedAt: report.startedAt || now,
            }
          : {}),
      },
    });

    await tx.reportStatusLog.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus: shouldMoveToInProgress ? ReportStatus.IN_PROGRESS : report.status,
        note: `Penanggung jawab ditetapkan kepada ${targetOfficer.name} oleh Admin.`,
        actorId: user.id,
      },
    });
  });

  return { success: true, message: "Penanggung jawab berhasil ditetapkan." };
}

/**
 * 7. Transition report status (Section 7 State Machine)
 */
export async function transitionReportStatus(
  reportId: string,
  input: TransitionReportInput
) {
  const user = await requireUser();

  const parsed = transitionReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Input transisi tidak valid.",
    };
  }

  const { toStatus, note, rejectionReason, resolutionNote, afterAttachmentKeys } =
    parsed.data;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      attachments: true,
    },
  });

  if (!report) {
    return { success: false, error: "Laporan tidak ditemukan." };
  }

  // Count existing AFTER attachments
  const existingAfterCount = report.attachments.filter(
    (a) => a.kind === AttachmentKind.AFTER
  ).length;
  const newAfterKeys = afterAttachmentKeys || [];
  const totalAfterCount = existingAfterCount + newAfterKeys.length;

  // Validate state machine
  const validation = validateStatusTransition(report.status, toStatus, {
    actor: user,
    report: {
      assigneeId: report.assigneeId,
      afterAttachmentCount: totalAfterCount,
      startedAt: report.startedAt,
    },
    note,
    rejectionReason,
    resolutionNote,
  });

  if (!validation.allowed) {
    return { success: false, error: validation.error };
  }

  // Verify any new AFTER attachments
  const verifiedNewAfterAttachments: {
    objectKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }[] = [];

  for (const key of newAfterKeys) {
    if (!isObjectKeyOwnedByUser(key, user.id)) {
      return {
        success: false,
        error: "Kunci foto AFTER tidak sah atau milik pengguna lain.",
      };
    }
    const metadata = await verifyObjectExists(key);
    if (!metadata) {
      return {
        success: false,
        error: `Foto penyelesaian ${key} belum terunggah.`,
      };
    }
    verifiedNewAfterAttachments.push({
      objectKey: key,
      fileName: key.split("/").pop() || "bukti-selesai.jpg",
      mimeType: metadata.contentType || "image/jpeg",
      sizeBytes: metadata.sizeBytes,
    });
  }

  const now = new Date();
  const updateData: any = {
    status: toStatus,
  };

  if (validation.newAssigneeId !== undefined) {
    updateData.assigneeId = validation.newAssigneeId;
  }

  if (validation.shouldSetStartedAt) {
    updateData.startedAt = report.startedAt || now;
  }

  if (validation.shouldSetCompletedAt) {
    updateData.completedAt = now;
    updateData.resolutionNote = resolutionNote || note;
  }

  if (validation.shouldClearCompletedAt) {
    updateData.completedAt = null;
  }

  if (toStatus === ReportStatus.REJECTED) {
    updateData.rejectionReason = rejectionReason || note;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Insert new AFTER attachments if any
    if (verifiedNewAfterAttachments.length > 0) {
      await tx.attachment.createMany({
        data: verifiedNewAfterAttachments.map((att) => ({
          reportId,
          kind: AttachmentKind.AFTER,
          objectKey: att.objectKey,
          fileName: att.fileName,
          mimeType: att.mimeType,
          sizeBytes: att.sizeBytes,
          uploadedById: user.id,
        })),
      });
    }

    // 2. Update report
    await tx.report.update({
      where: { id: reportId },
      data: updateData,
    });

    // 3. Create status log
    await tx.reportStatusLog.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus,
        note: note || resolutionNote || rejectionReason || `Status diubah ke ${toStatus}.`,
        actorId: user.id,
      },
    });
  });

  return { success: true, message: `Status laporan berhasil diperbarui menjadi ${toStatus}.` };
}

/**
 * 8. Kanban Board Data (FR-KAN-01 s/d FR-KAN-05)
 */
export async function getKanbanBoardData(filters: {
  category?: ReportCategory;
  priority?: ReportPriority;
  assigneeId?: string;
  myTasksOnly?: boolean;
  search?: string;
} = {}) {
  const user = await requireUser();

  if (!canViewKanban(user)) {
    return { success: false, error: UI_TEXT.unauthorized };
  }

  const whereBase: any = {};
  if (filters.category) whereBase.category = filters.category;
  if (filters.priority) whereBase.priority = filters.priority;
  if (filters.myTasksOnly) {
    whereBase.assigneeId = user.id;
  } else if (filters.assigneeId) {
    whereBase.assigneeId = filters.assigneeId;
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    const numericMatch = term.match(/(?:GA-)?0*(\d+)/i);
    const parsedNumber = numericMatch ? parseInt(numericMatch[1], 10) : null;

    whereBase.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { locationDetail: { contains: term, mode: "insensitive" } },
      ...(parsedNumber ? [{ number: parsedNumber }] : []),
    ];
  }

  // FR-KAN-05: Kolom Selesai hanya menampilkan 30 hari terakhir
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newReports, inProgressReports, doneReports] = await Promise.all([
    // NEW
    prisma.report.findMany({
      where: { ...whereBase, status: ReportStatus.NEW },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { attachments: true } },
      },
    }),
    // IN_PROGRESS
    prisma.report.findMany({
      where: { ...whereBase, status: ReportStatus.IN_PROGRESS },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { attachments: true } },
      },
    }),
    // DONE (last 30 days)
    prisma.report.findMany({
      where: {
        ...whereBase,
        status: ReportStatus.DONE,
        completedAt: { gte: thirtyDaysAgo },
      },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { attachments: true } },
      },
    }),
  ]);

  // Priority sort helper: HIGH > MEDIUM > LOW, then oldest first (createdAt: asc)
  const priorityWeight = {
    [ReportPriority.HIGH]: 3,
    [ReportPriority.MEDIUM]: 2,
    [ReportPriority.LOW]: 1,
  };

  const sortCards = (cards: any[]) => {
    return cards.sort((a, b) => {
      const pDiff =
        (priorityWeight[b.priority as ReportPriority] || 0) -
        (priorityWeight[a.priority as ReportPriority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  return {
    success: true,
    data: {
      columns: {
        NEW: sortCards(
          newReports.map((r) => ({
            ...r,
            formattedNumber: formatReportNumber(r.number),
          }))
        ),
        IN_PROGRESS: sortCards(
          inProgressReports.map((r) => ({
            ...r,
            formattedNumber: formatReportNumber(r.number),
          }))
        ),
        DONE: sortCards(
          doneReports.map((r) => ({
            ...r,
            formattedNumber: formatReportNumber(r.number),
          }))
        ),
      },
    },
  };
}
