import Link from "next/link";
import { getDashboardStats } from "../../../server/dashboard";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../../../components/ui/badge";
import { formatDate } from "../../../lib/format";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { ReportStatus, ReportPriority } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const res = await getDashboardStats();

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-[#57534E]">
        Gagal memuat data dashboard.
      </div>
    );
  }

  const {
    countsByStatus,
    countsByCategory,
    totalReports,
    newReportsOverTwoDaysCount,
    averageResolutionHours,
    recentReports,
  } = res.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917]">
          Dashboard Ringkasan
        </h1>
        <p className="text-xs text-[#57534E] mt-1">
          Pantau status penanganan laporan General Affairs secara real-time
        </p>
      </div>

      {/* SLA Alert banner if overdue NEW reports exist */}
      {newReportsOverTwoDaysCount > 0 && (
        <div className="flex items-center p-4 bg-[#FFEDD5] border border-[#FED7AA] rounded-xl text-[#9A3412]">
          <AlertTriangle className="w-5 h-5 mr-3 shrink-0" strokeWidth={1.5} />
          <div className="text-sm font-medium">
            Terdapat {newReportsOverTwoDaysCount} laporan baru yang belum ditangani selama lebih dari 2 hari.
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#57534E] text-xs font-medium">
            <span>Total Laporan</span>
            <FileText className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-semibold text-[#1C1917] mt-2">
            {totalReports}
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#92400E] text-xs font-medium">
            <span>Sedang Diproses</span>
            <Clock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-semibold text-[#1C1917] mt-2">
            {countsByStatus[ReportStatus.IN_PROGRESS]}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#166534] text-xs font-medium">
            <span>Selesai Ditangani</span>
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-semibold text-[#1C1917] mt-2">
            {countsByStatus[ReportStatus.DONE]}
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#57534E] text-xs font-medium">
            <span>Rata-rata Waktu Selesai</span>
            <Clock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-semibold text-[#1C1917] mt-2">
            {averageResolutionHours !== null ? `${averageResolutionHours} Jam` : "-"}
          </div>
        </div>
      </div>

      {/* Breakdown by Category & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[#1C1917] mb-3">
            <Building2 className="w-4 h-4 text-[#57534E]" strokeWidth={1.5} />
            <span>Gedung</span>
          </div>
          <div className="text-xl font-medium text-[#1C1917]">
            {countsByCategory.BUILDING} Laporan
          </div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[#1C1917] mb-3">
            <UtensilsCrossed className="w-4 h-4 text-[#57534E]" strokeWidth={1.5} />
            <span>Catering</span>
          </div>
          <div className="text-xl font-medium text-[#1C1917]">
            {countsByCategory.CATERING} Laporan
          </div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
          <div className="flex items-center space-x-2 text-sm font-semibold text-[#1C1917] mb-3">
            <Wrench className="w-4 h-4 text-[#57534E]" strokeWidth={1.5} />
            <span>Sarpras</span>
          </div>
          <div className="text-xl font-medium text-[#1C1917]">
            {countsByCategory.FACILITY} Laporan
          </div>
        </div>
      </div>

      {/* 10 Recent Reports Table */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1C1917]">
            10 Laporan Terbaru
          </h2>
          <Link
            href="/reports"
            className="text-xs text-[#9A7B4F] hover:underline font-medium"
          >
            Lihat Semua Laporan
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF9] text-[#57534E] border-b border-[#E7E5E4]">
              <tr>
                <th className="px-6 py-3 font-medium">Nomor</th>
                <th className="px-6 py-3 font-medium">Judul</th>
                <th className="px-6 py-3 font-medium">Kategori</th>
                <th className="px-6 py-3 font-medium">Prioritas</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Pelapor</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-6 py-3 font-medium text-[#1C1917]">
                    <Link
                      href={`/reports/${report.id}`}
                      className="hover:underline text-[#1E293B]"
                    >
                      {report.formattedNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 max-w-xs truncate text-[#1C1917]">
                    {report.title}
                  </td>
                  <td className="px-6 py-3">
                    <CategoryBadge category={report.category} />
                  </td>
                  <td className="px-6 py-3">
                    <PriorityBadge priority={report.priority as ReportPriority} />
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-6 py-3 text-[#57534E]">
                    {report.reporterName}
                  </td>
                  <td className="px-6 py-3 text-[#57534E]">
                    {formatDate(report.createdAt, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
