import { requireUser } from "../../../server/auth";
import { getKanbanBoardData } from "../../../server/reports";
import { KanbanBoard } from "../../../components/board/kanban-board";
import { canViewKanban } from "../../../lib/permissions";
import { notFound } from "next/navigation";
import { ReportCategory, ReportPriority } from "@prisma/client";
import { Search, Filter } from "lucide-react";
import { Button } from "../../../components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    category?: ReportCategory;
    priority?: ReportPriority;
    myTasksOnly?: string;
    search?: string;
  }>;
}

export default async function BoardPage({ searchParams }: PageProps) {
  const user = await requireUser();

  if (!canViewKanban(user)) {
    notFound();
  }

  const params = await searchParams;
  const category = params.category;
  const priority = params.priority;
  const myTasksOnly = params.myTasksOnly === "true";
  const search = params.search || "";

  const res = await getKanbanBoardData({
    category,
    priority,
    myTasksOnly,
    search,
  });

  const columns = res.data?.columns || { NEW: [], IN_PROGRESS: [], DONE: [] };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1917]">
            Papan Kanban
          </h1>
          <p className="text-xs text-[#57534E] mt-1">
            Kelola alur penyelesaian laporan dari Baru, Diproses, hingga Selesai
          </p>
        </div>
      </div>

      {/* Filter Bar */}
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

          {/* Priority Filter */}
          <div>
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
          </div>

          {/* Task Filter & Submit */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-xs text-[#1C1917] cursor-pointer">
              <input
                type="checkbox"
                name="myTasksOnly"
                value="true"
                defaultChecked={myTasksOnly}
                className="mr-1.5 rounded border-[#E7E5E4] text-[#1E293B]"
              />
              Tugas Saya
            </label>
            <Button type="submit" variant="secondary" size="sm" className="ml-auto">
              <Filter className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Kanban Board */}
      <KanbanBoard initialColumns={columns} currentUser={user} />
    </div>
  );
}
