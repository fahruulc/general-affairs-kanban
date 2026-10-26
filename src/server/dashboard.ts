"use server";

import prisma from "../lib/db";
import { requireRole } from "./auth";
import { Role, ReportStatus, ReportCategory } from "@prisma/client";
import { formatReportNumber } from "../lib/format";

export interface DashboardStats {
  countsByStatus: Record<ReportStatus, number>;
  countsByCategory: Record<ReportCategory, number>;
  totalReports: number;
  newReportsOverTwoDaysCount: number;
  averageResolutionHours: number | null;
  recentReports: {
    id: string;
    formattedNumber: string;
    title: string;
    category: ReportCategory;
    priority: string;
    status: ReportStatus;
    reporterName: string;
    createdAt: Date;
  }[];
}

/**
 * Admin summary dashboard metrics (PRD 6.6)
 */
export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  await requireRole([Role.ADMIN]);

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const [
    statusCounts,
    categoryCounts,
    newOverTwoDays,
    completedReports,
    recentReportsRaw,
    totalReports,
  ] = await Promise.all([
    // Group by status
    prisma.report.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    // Group by category
    prisma.report.groupBy({
      by: ["category"],
      _count: { category: true },
    }),
    // Count NEW reports older than 2 days
    prisma.report.count({
      where: {
        status: ReportStatus.NEW,
        createdAt: { lte: twoDaysAgo },
      },
    }),
    // Completed reports to calculate average resolution time
    prisma.report.findMany({
      where: {
        status: ReportStatus.DONE,
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    }),
    // 10 latest reports
    prisma.report.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { name: true } },
      },
    }),
    // Total count
    prisma.report.count(),
  ]);

  // Map counts by status
  const countsByStatus: Record<ReportStatus, number> = {
    [ReportStatus.NEW]: 0,
    [ReportStatus.IN_PROGRESS]: 0,
    [ReportStatus.DONE]: 0,
    [ReportStatus.REJECTED]: 0,
  };
  for (const s of statusCounts) {
    countsByStatus[s.status] = s._count.status;
  }

  // Map counts by category
  const countsByCategory: Record<ReportCategory, number> = {
    [ReportCategory.BUILDING]: 0,
    [ReportCategory.CATERING]: 0,
    [ReportCategory.FACILITY]: 0,
  };
  for (const c of categoryCounts) {
    countsByCategory[c.category] = c._count.category;
  }

  // Calculate average resolution time in hours
  let averageResolutionHours: number | null = null;
  if (completedReports.length > 0) {
    const totalDurationMs = completedReports.reduce((acc, report) => {
      if (report.completedAt) {
        return acc + (report.completedAt.getTime() - report.createdAt.getTime());
      }
      return acc;
    }, 0);
    const avgMs = totalDurationMs / completedReports.length;
    averageResolutionHours = parseFloat((avgMs / (1000 * 60 * 60)).toFixed(1));
  }

  const recentReports = recentReportsRaw.map((r) => ({
    id: r.id,
    formattedNumber: formatReportNumber(r.number),
    title: r.title,
    category: r.category,
    priority: r.priority,
    status: r.status,
    reporterName: r.reporter.name,
    createdAt: r.createdAt,
  }));

  return {
    success: true,
    data: {
      countsByStatus,
      countsByCategory,
      totalReports,
      newReportsOverTwoDaysCount: newOverTwoDays,
      averageResolutionHours,
      recentReports,
    },
  };
}
