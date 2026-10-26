"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ReportStatus,
  ReportCategory,
  ReportPriority,
  Role,
} from "@prisma/client";
import {
  StatusBadge,
  PriorityBadge,
  CategoryBadge,
} from "../ui/badge";
import { Avatar } from "../ui/avatar";
import { Modal } from "../ui/modal";
import { ImageUploader } from "../upload/image-uploader";
import { Button } from "../ui/button";
import { transitionReportStatus, claimReport } from "../../server/reports";
import {
  MapPin,
  Image as ImageIcon,
  MoreVertical,
  Hand,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { UI_TEXT } from "../../lib/constants";

interface KanbanBoardProps {
  initialColumns: {
    NEW: any[];
    IN_PROGRESS: any[];
    DONE: any[];
  };
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
}

export function KanbanBoard({ initialColumns, currentUser }: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState<any | null>(null);

  // Transition modals
  const [targetReport, setTargetReport] = useState<any | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [afterAttachmentKeys, setAfterAttachmentKeys] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCardById(String(active.id));
    setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = String(active.id);
    const overContainer = over.id as ReportStatus;

    const sourceCard = findCardById(activeId);
    if (!sourceCard) return;

    if (sourceCard.status === overContainer) return;

    // Trigger state change dialogs or direct transitions
    if (overContainer === ReportStatus.DONE) {
      setTargetReport(sourceCard);
      setCompleteModalOpen(true);
      return;
    }

    if (overContainer === ReportStatus.IN_PROGRESS && sourceCard.status === ReportStatus.NEW) {
      await executeClaimOrTransition(sourceCard, ReportStatus.IN_PROGRESS);
      return;
    }

    if (overContainer === ReportStatus.NEW && sourceCard.status === ReportStatus.IN_PROGRESS) {
      await executeDirectTransition(sourceCard, ReportStatus.NEW);
      return;
    }
  };

  const findCardById = (id: string) => {
    for (const key of Object.keys(columns) as (keyof typeof columns)[]) {
      const match = columns[key].find((c: any) => c.id === id);
      if (match) return match;
    }
    return null;
  };

  const executeClaimOrTransition = async (report: any, toStatus: ReportStatus) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await transitionReportStatus(report.id, {
        toStatus,
        note: `Dipindahkan ke ${toStatus} melalui papan Kanban.`,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Gagal memindahkan status kartu.");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const executeDirectTransition = async (report: any, toStatus: ReportStatus) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await transitionReportStatus(report.id, {
        toStatus,
        note: `Dipindahkan ke ${toStatus} melalui papan Kanban.`,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Gagal memindahkan status kartu.");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReport) return;
    if (afterAttachmentKeys.length === 0) {
      setErrorMsg(UI_TEXT.afterPhotoRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await transitionReportStatus(targetReport.id, {
        toStatus: ReportStatus.DONE,
        resolutionNote,
        afterAttachmentKeys,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyelesaikan laporan.");
      } else {
        setCompleteModalOpen(false);
        setResolutionNote("");
        setAfterAttachmentKeys([]);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReport) return;
    if (!rejectionReason.trim()) {
      setErrorMsg(UI_TEXT.rejectionReasonRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await transitionReportStatus(targetReport.id, {
        toStatus: ReportStatus.REJECTED,
        rejectionReason,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menolak laporan.");
      } else {
        setRejectModalOpen(false);
        setRejectionReason("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B]">
          {errorMsg}
        </div>
      )}

      <DndContext
        id="kanban-board-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom 1: BARU (NEW) */}
          <KanbanColumn
            id={ReportStatus.NEW}
            title="Baru"
            count={columns.NEW.length}
            cards={columns.NEW}
            currentUser={currentUser}
            onOpenRejectModal={(report) => {
              setTargetReport(report);
              setRejectModalOpen(true);
            }}
            onDirectMove={executeDirectTransition}
          />

          {/* Kolom 2: DIPROSES (IN_PROGRESS) */}
          <KanbanColumn
            id={ReportStatus.IN_PROGRESS}
            title="Diproses"
            count={columns.IN_PROGRESS.length}
            cards={columns.IN_PROGRESS}
            currentUser={currentUser}
            onOpenCompleteModal={(report) => {
              setTargetReport(report);
              setCompleteModalOpen(true);
            }}
            onOpenRejectModal={(report) => {
              setTargetReport(report);
              setRejectModalOpen(true);
            }}
            onDirectMove={executeDirectTransition}
          />

          {/* Kolom 3: SELESAI (DONE) */}
          <KanbanColumn
            id={ReportStatus.DONE}
            title="Selesai (30 Hari Terakhir)"
            count={columns.DONE.length}
            cards={columns.DONE}
            currentUser={currentUser}
            onDirectMove={executeDirectTransition}
          />
        </div>

        {/* Drag Overlay Thumbnail */}
        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Modal: Complete Report (Wajib Catatan & Minimal 1 Foto AFTER) */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Tandai Selesai"
        description="Wajib menyertakan catatan penyelesaian dan minimal satu foto bukti hasil pekerjaan."
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Catatan Penyelesaian
            </label>
            <textarea
              required
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Jelaskan tindakan perbaikan yang telah dilakukan..."
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Foto Bukti Penyelesaian (AFTER)
            </label>
            <ImageUploader
              maxPhotos={5}
              onKeysChange={(keys) => setAfterAttachmentKeys(keys)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompleteModalOpen(false)}
              disabled={loading}
            >
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              Konfirmasi Selesai
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reject Report */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tolak Laporan"
        description="Sertakan alasan penolakan secara jelas dan objektif."
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Alasan Penolakan
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Di luar lingkup fasilitas kantor..."
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              disabled={loading}
            >
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={loading}>
              Tolak Laporan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  count,
  cards,
  currentUser,
  onOpenCompleteModal,
  onOpenRejectModal,
  onDirectMove,
}: {
  id: ReportStatus;
  title: string;
  count: number;
  cards: any[];
  currentUser: any;
  onOpenCompleteModal?: (report: any) => void;
  onOpenRejectModal?: (report: any) => void;
  onDirectMove: (report: any, toStatus: ReportStatus) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4 flex flex-col h-[750px]"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E4] mb-3">
        <h2 className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full border border-[#E7E5E4] text-[#57534E]">
          {count}
        </span>
      </div>

      {/* Cards Scrollable Area */}
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {cards.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-[#57534E] border border-dashed border-[#E7E5E4] rounded-lg">
              Kosong
            </div>
          ) : (
            cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                currentUser={currentUser}
                onOpenCompleteModal={onOpenCompleteModal}
                onOpenRejectModal={onOpenRejectModal}
                onDirectMove={onDirectMove}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableCard({
  card,
  currentUser,
  onOpenCompleteModal,
  onOpenRejectModal,
  onDirectMove,
}: {
  card: any;
  currentUser: any;
  onOpenCompleteModal?: (report: any) => void;
  onOpenRejectModal?: (report: any) => void;
  onDirectMove: (report: any, toStatus: ReportStatus) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        card={card}
        currentUser={currentUser}
        onOpenCompleteModal={onOpenCompleteModal}
        onOpenRejectModal={onOpenRejectModal}
        onDirectMove={onDirectMove}
      />
    </div>
  );
}

function KanbanCard({
  card,
  isOverlay = false,
  currentUser,
  onOpenCompleteModal,
  onOpenRejectModal,
  onDirectMove,
}: {
  card: any;
  isOverlay?: boolean;
  currentUser?: any;
  onOpenCompleteModal?: (report: any) => void;
  onOpenRejectModal?: (report: any) => void;
  onDirectMove?: (report: any, toStatus: ReportStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === Role.ADMIN;
  const isOfficer = currentUser?.role === Role.OFFICER;
  const isAssignee = card.assigneeId === currentUser?.id;

  return (
    <div
      className={`bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-sm hover:border-[#1E293B] transition-all relative ${
        isOverlay ? "rotate-2 shadow-xl border-[#1E293B]" : ""
      }`}
    >
      {/* Top Header: GA Number, Priority & Accessibility Action Menu */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#1E293B]">
          {card.formattedNumber}
        </span>
        <div className="flex items-center space-x-1.5">
          <PriorityBadge priority={card.priority} />

          {/* Non-drag Accessibility Menu (FR-KAN-03: alternatif menu Pindahkan ke) */}
          {!isOverlay && onDirectMove && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 text-[#57534E] hover:text-[#1C1917] rounded-md transition-colors"
                title="Pindahkan ke"
                aria-label="Pindahkan ke"
              >
                <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-6 z-20 w-44 bg-white border border-[#E7E5E4] rounded-lg shadow-lg py-1 text-xs text-[#1C1917]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1 font-semibold text-[#57534E] border-b border-[#E7E5E4] text-[10px] uppercase">
                    Pindahkan Ke
                  </div>

                  {card.status === ReportStatus.NEW && (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDirectMove(card, ReportStatus.IN_PROGRESS);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#FAFAF9] flex items-center"
                      >
                        <Hand className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                        Ambil & Proses
                      </button>
                      {onOpenRejectModal && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenRejectModal(card);
                          }}
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-[#FEE2E2] flex items-center"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                          Tolak Laporan
                        </button>
                      )}
                    </>
                  )}

                  {card.status === ReportStatus.IN_PROGRESS && (
                    <>
                      {onOpenCompleteModal && (isAssignee || isAdmin) && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenCompleteModal(card);
                          }}
                          className="w-full text-left px-3 py-2 text-green-700 hover:bg-[#DCFCE7] flex items-center"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                          Tandai Selesai
                        </button>
                      )}
                      {(isAssignee || isAdmin) && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onDirectMove(card, ReportStatus.NEW);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#FAFAF9] flex items-center"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                          Kembalikan ke Baru
                        </button>
                      )}
                      {onOpenRejectModal && (isAssignee || isAdmin) && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onOpenRejectModal(card);
                          }}
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-[#FEE2E2] flex items-center"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                          Tolak Laporan
                        </button>
                      )}
                    </>
                  )}

                  {card.status === ReportStatus.DONE && isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDirectMove(card, ReportStatus.IN_PROGRESS);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAFAF9] flex items-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                      Buka Kembali
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Title linked to details */}
      <Link href={`/reports/${card.id}`}>
        <h3 className="text-xs font-semibold text-[#1C1917] line-clamp-2 hover:underline mb-2">
          {card.title}
        </h3>
      </Link>

      {/* Location */}
      <div className="flex items-center text-[11px] text-[#57534E] mb-3">
        <MapPin className="w-3 h-3 mr-1 shrink-0" strokeWidth={1.5} />
        <span className="truncate">{card.locationDetail}</span>
      </div>

      {/* Footer Info: Category, Photo Count & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E4] text-xs">
        <CategoryBadge category={card.category} />

        <div className="flex items-center space-x-2">
          <span className="flex items-center text-[11px] text-[#57534E]">
            <ImageIcon className="w-3 h-3 mr-0.5" strokeWidth={1.5} />
            {card._count?.attachments || 0}
          </span>
          {card.assignee ? (
            <Avatar name={card.assignee.name} size="sm" />
          ) : (
            <span className="text-[10px] text-[#57534E] bg-[#FAFAF9] border border-[#E7E5E4] px-1.5 py-0.5 rounded">
              Tanpa Petugas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
