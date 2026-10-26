"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  claimReport,
  transitionReportStatus,
} from "../../../../server/reports";
import { addComment } from "../../../../server/comments";
import { StatusBadge, PriorityBadge, CategoryBadge, RoleBadge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Modal } from "../../../../components/ui/modal";
import { ImageUploader } from "../../../../components/upload/image-uploader";
import { formatDate } from "../../../../lib/format";
import { UI_TEXT } from "../../../../lib/constants";
import {
  Role,
  ReportStatus,
  ReportPriority,
  AttachmentKind,
} from "@prisma/client";
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Hand,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";

interface ReportDetailViewProps {
  report: any;
  currentUser: {
    id: string;
    name: string;
    role: Role;
  };
}

export function ReportDetailView({ report, currentUser }: ReportDetailViewProps) {
  const router = useRouter();

  // Dialog states
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Form inputs
  const [resolutionNote, setResolutionNote] = useState("");
  const [afterAttachmentKeys, setAfterAttachmentKeys] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reopenNote, setReopenNote] = useState("");
  const [commentText, setCommentText] = useState("");

  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isAssignee = report.assigneeId === currentUser.id;
  const isAdmin = currentUser.role === Role.ADMIN;
  const isOfficer = currentUser.role === Role.OFFICER;

  const canClaim =
    (isAdmin || isOfficer) &&
    report.status === ReportStatus.NEW &&
    !report.assigneeId;

  const canMarkDone =
    report.status === ReportStatus.IN_PROGRESS && (isAssignee || isAdmin);

  const canReject =
    (report.status === ReportStatus.NEW && (isAdmin || isOfficer)) ||
    (report.status === ReportStatus.IN_PROGRESS && (isAssignee || isAdmin));

  const canReopen = report.status === ReportStatus.DONE && isAdmin;

  // Split attachments
  const beforeAttachments = report.attachments.filter(
    (a: any) => a.kind === AttachmentKind.BEFORE
  );
  const afterAttachments = report.attachments.filter(
    (a: any) => a.kind === AttachmentKind.AFTER
  );

  // 1. Handle Claim
  const handleClaim = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await claimReport(report.id);
      if (!res.success) {
        setErrorMsg(res.error || "Gagal mengambil laporan.");
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Mark Done
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (afterAttachmentKeys.length === 0) {
      setErrorMsg(UI_TEXT.afterPhotoRequired);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await transitionReportStatus(report.id, {
        toStatus: ReportStatus.DONE,
        resolutionNote,
        afterAttachmentKeys,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyelesaikan laporan.");
      } else {
        setCompleteModalOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Reject
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setErrorMsg(UI_TEXT.rejectionReasonRequired);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await transitionReportStatus(report.id, {
        toStatus: ReportStatus.REJECTED,
        rejectionReason,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Gagal menolak laporan.");
      } else {
        setRejectModalOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Reopen
  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenNote.trim()) {
      setErrorMsg("Catatan pembukaan kembali wajib diisi.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await transitionReportStatus(report.id, {
        toStatus: ReportStatus.IN_PROGRESS,
        note: reopenNote,
      });
      if (!res.success) {
        setErrorMsg(res.error || "Gagal membuka kembali laporan.");
      } else {
        setReopenModalOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await addComment({
        reportId: report.id,
        body: commentText.trim(),
      });
      if (res.success) {
        setCommentText("");
        router.refresh();
      }
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Number and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-lg font-semibold text-[#1E293B]">
              {report.formattedNumber}
            </span>
            <StatusBadge status={report.status} />
            <PriorityBadge priority={report.priority as ReportPriority} />
            <CategoryBadge category={report.category} />
          </div>
          <h1 className="text-xl font-semibold text-[#1C1917] mt-1">
            {report.title}
          </h1>
          <div className="flex items-center text-xs text-[#57534E] space-x-4 mt-2">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              {report.locationDetail}
            </span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              {formatDate(report.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canClaim && (
            <Button
              variant="primary"
              size="sm"
              isLoading={loading}
              onClick={handleClaim}
            >
              <Hand className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              {UI_TEXT.claimReport}
            </Button>
          )}

          {canMarkDone && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setErrorMsg("");
                setCompleteModalOpen(true);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              {UI_TEXT.markDone}
            </Button>
          )}

          {canReject && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setErrorMsg("");
                setRejectModalOpen(true);
              }}
            >
              <XCircle className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              {UI_TEXT.rejectReport}
            </Button>
          )}

          {canReopen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setErrorMsg("");
                setReopenModalOpen(true);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              {UI_TEXT.reopenReport}
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B]">
          {errorMsg}
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Details & Photos) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-2">
              Deskripsi Permasalahan
            </h2>
            <p className="text-sm text-[#1C1917] whitespace-pre-wrap leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Resolution or Rejection Note if exists */}
          {report.resolutionNote && (
            <div className="bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl p-5 text-[#166534]">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                Catatan Penyelesaian
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {report.resolutionNote}
              </p>
            </div>
          )}

          {report.rejectionReason && (
            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-xl p-5 text-[#991B1B]">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1">
                Alasan Penolakan
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {report.rejectionReason}
              </p>
            </div>
          )}

          {/* Photo Gallery: BEFORE & AFTER Side by Side */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-semibold text-[#1C1917]">
              Galeri Bukti Foto
            </h2>

            {/* BEFORE Section */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FAFAF9] border border-[#E7E5E4] text-[#1C1917]">
                  Sebelum (BEFORE)
                </span>
                <span className="text-xs text-[#57534E]">
                  {beforeAttachments.length} foto bukti awal
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {beforeAttachments.map((att: any) => (
                  <div
                    key={att.id}
                    onClick={() => setLightboxUrl(att.signedUrl)}
                    className="relative aspect-square rounded-lg border border-[#E7E5E4] overflow-hidden bg-[#FAFAF9] cursor-pointer group"
                  >
                    {att.signedUrl ? (
                      <img
                        src={att.signedUrl}
                        alt="Foto Sebelum"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[#57534E]">
                        <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER Section */}
            <div className="pt-4 border-t border-[#E7E5E4]">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#DCFCE7] border border-[#BBF7D0] text-[#166534]">
                  Sesudah (AFTER)
                </span>
                <span className="text-xs text-[#57534E]">
                  {afterAttachments.length} foto bukti penyelesaian
                </span>
              </div>
              {afterAttachments.length === 0 ? (
                <p className="text-xs text-[#57534E] italic py-3">
                  Belum ada foto penyelesaian yang diunggah.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {afterAttachments.map((att: any) => (
                    <div
                      key={att.id}
                      onClick={() => setLightboxUrl(att.signedUrl)}
                      className="relative aspect-square rounded-lg border border-[#E7E5E4] overflow-hidden bg-[#FAFAF9] cursor-pointer group"
                    >
                      {att.signedUrl ? (
                        <img
                          src={att.signedUrl}
                          alt="Foto Sesudah"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#57534E]">
                          <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (People, Timeline & Comments) */}
        <div className="space-y-6">
          {/* People Information */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">
              Informasi Terkait
            </h2>

            <div>
              <div className="text-xs text-[#57534E]">Pelapor:</div>
              <div className="text-sm font-medium text-[#1C1917] mt-0.5">
                {report.reporter?.name}
              </div>
              <div className="text-xs text-[#57534E]">
                {report.reporter?.department?.name || "-"}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7E5E4]">
              <div className="text-xs text-[#57534E]">Penanggung Jawab:</div>
              <div className="text-sm font-medium text-[#1C1917] mt-0.5">
                {report.assignee?.name || "Belum ada petugas"}
              </div>
              {report.assignee?.phone && (
                <div className="text-xs text-[#57534E]">
                  {report.assignee.phone}
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[#1C1917]">
              Linimasa Riwayat Status
            </h2>
            <div className="space-y-4">
              {report.statusLogs?.map((log: any, idx: number) => (
                <div key={log.id} className="relative pl-6 pb-2 border-l border-[#E7E5E4] last:border-l-0">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-[#1E293B]" />
                  <div className="flex items-center justify-between text-xs mb-1">
                    <StatusBadge status={log.toStatus} />
                    <span className="text-[#57534E]">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-[#1C1917] font-medium">
                    {log.actor?.name} ({log.actor?.role})
                  </div>
                  {log.note && (
                    <div className="text-xs text-[#57534E] mt-1 bg-[#FAFAF9] p-2 rounded-lg border border-[#E7E5E4]">
                      {log.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments Discussion Section */}
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[#1C1917] flex items-center justify-between">
              <span>Percakapan & Komentar</span>
              <MessageSquare className="w-4 h-4 text-[#57534E]" strokeWidth={1.5} />
            </h2>

            {/* Comments List */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {report.comments?.length === 0 ? (
                <p className="text-xs text-[#57534E] text-center py-4">
                  Belum ada komentar pada laporan ini.
                </p>
              ) : (
                report.comments.map((comment: any) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1C1917]">
                        {comment.author?.name}
                      </span>
                      <span className="text-[10px] text-[#57534E]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#1C1917] whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-[#E7E5E4] space-y-2">
              <textarea
                rows={2}
                required
                maxLength={1000}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis pesan atau perkembangan penanganan..."
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={commentLoading}
                >
                  {UI_TEXT.sendComment}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal: Complete Report (Requires Note + AFTER Photo) */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Tandai Laporan Selesai"
        description="Wajib menyertakan catatan penyelesaian dan minimal satu foto bukti hasil pekerjaan."
      >
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Catatan Penyelesaian
            </label>
            <textarea
              required
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Jelaskan tindakan yang telah dilakukan untuk menyelesaikan laporan ini..."
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Unggah Foto Bukti Selesai (AFTER)
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
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Alasan Penolakan
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Di luar lingkup fasilitas kantor, atau pengadaan harus melalui divisi terkait..."
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

      {/* Modal: Reopen Report */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Buka Kembali Laporan"
        description="Laporan yang sudah selesai akan dikembalikan ke status Diproses."
      >
        <form onSubmit={handleReopen} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Catatan Alasan Pembukaan Kembali
            </label>
            <textarea
              required
              rows={3}
              value={reopenNote}
              onChange={(e) => setReopenNote(e.target.value)}
              placeholder="Jelaskan alasan mengapa perbaikan perlu dikerjakan kembali..."
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReopenModalOpen(false)}
              disabled={loading}
            >
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              Buka Kembali
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal for enlarged photo viewing */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <img
              src={lightboxUrl}
              alt="Perbesaran Foto"
              className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
