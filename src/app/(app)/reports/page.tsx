import Link from "next/link";
import { getReportsList } from "../../../server/reports";
import { getCurrentUser } from "../../../server/auth";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../../../components/ui/badge";
import { formatDate } from "../../../lib/format";
import { Plus, Search, Filter } from "lucide-react";
import { Role, ReportCategory, ReportStatus, ReportPriority } from "@prisma/client";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: ReportCategory;
    status?: ReportStatus;
    priority?: ReportPriority;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const currentPage = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const category = params.category;
  const status = params.status;
  const priority = params.priority;

  const res = await getReportsList({
    page: currentPage,
    search,
    category,
    status,
    priority,
  });

  const reports = res.data || [];
  const pagination = res.pagination || { page: 1, totalPages: 1, totalCount: 0 };

  const isStaff = user?.role === Role.ADMIN || user?.role === Role.OFFICER;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1917]">
            {user?.role === Role.EMPLOYEE ? "Laporan Saya" : "Daftar Laporan"}
          </h1>
          <p className="text-xs text-[#57534E] mt-1">
            Total {pagination.totalCount} laporan tercatat di sistem
          </p>
        </div>

        <Link href="/reports/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Buat Laporan
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#57534E]" strokeWidth={1.5} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Cari judul, lokasi, atau nomor GA..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              name="category"
              defaultValue={category || ""}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            >
              <option value="">Semua Kategori</option>
              <option value="BUILDING">Gedung</option>
              <option value="CATERING">Catering</option>
              <option value="FACILITY">Sarpras</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              defaultValue={status || ""}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            >
              <option value="">Semua Status</option>
              <option value="NEW">Baru</option>
              <option value="IN_PROGRESS">Diproses</option>
              <option value="DONE">Selesai</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex space-x-2">
            <select
              name="priority"
              defaultValue={priority || ""}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            >
              <option value="">Semua Prioritas</option>
              <option value="LOW">Rendah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Tinggi</option>
            </select>
            <Button type="submit" variant="secondary" size="sm">
              <Filter className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Reports Table (Desktop) */}
      <div className="hidden md:block bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAF9] text-[#57534E] border-b border-[#E7E5E4]">
            <tr>
              <th className="px-6 py-3 font-medium">Nomor</th>
              <th className="px-6 py-3 font-medium">Judul</th>
              <th className="px-6 py-3 font-medium">Kategori</th>
              <th className="px-6 py-3 font-medium">Prioritas</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Lokasi</th>
              {isStaff && <th className="px-6 py-3 font-medium">Pelapor</th>}
              <th className="px-6 py-3 font-medium">Penanggung Jawab</th>
              <th className="px-6 py-3 font-medium">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4]">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={isStaff ? 9 : 8} className="px-6 py-8 text-center text-[#57534E]">
                  Tidak ada laporan yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-6 py-3 font-medium">
                    <Link
                      href={`/reports/${report.id}`}
                      className="hover:underline text-[#1E293B]"
                    >
                      {report.formattedNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3 max-w-xs truncate text-[#1C1917] font-medium">
                    <Link href={`/reports/${report.id}`} className="hover:underline">
                      {report.title}
                    </Link>
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
                  <td className="px-6 py-3 text-[#57534E] max-w-xs truncate">
                    {report.locationDetail}
                  </td>
                  {isStaff && (
                    <td className="px-6 py-3 text-[#57534E]">
                      {report.reporter?.name || "-"}
                    </td>
                  )}
                  <td className="px-6 py-3 text-[#57534E]">
                    {report.assignee?.name || "Belum ada"}
                  </td>
                  <td className="px-6 py-3 text-[#57534E]">
                    {formatDate(report.createdAt, false)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reports Card List (Mobile) */}
      <div className="md:hidden space-y-3">
        {reports.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#57534E] bg-white border border-[#E7E5E4] rounded-xl">
            Tidak ada laporan yang sesuai.
          </div>
        ) : (
          reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block bg-white border border-[#E7E5E4] rounded-xl p-4 hover:border-[#1E293B] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1E293B]">
                  {report.formattedNumber}
                </span>
                <StatusBadge status={report.status} />
              </div>
              <h3 className="text-sm font-medium text-[#1C1917] line-clamp-2 mb-2">
                {report.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-[#57534E] pt-2 border-t border-[#E7E5E4]">
                <CategoryBadge category={report.category} />
                <span>{formatDate(report.createdAt, false)}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#E7E5E4]">
          <div className="text-xs text-[#57534E]">
            Halaman {pagination.page} dari {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            {pagination.page > 1 && (
              <Link
                href={`/reports?page=${pagination.page - 1}&search=${encodeURIComponent(
                  search
                )}`}
              >
                <Button variant="secondary" size="sm">
                  Sebelumnya
                </Button>
              </Link>
            )}
            {pagination.page < pagination.totalPages && (
              <Link
                href={`/reports?page=${pagination.page + 1}&search=${encodeURIComponent(
                  search
                )}`}
              >
                <Button variant="secondary" size="sm">
                  Selanjutnya
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
