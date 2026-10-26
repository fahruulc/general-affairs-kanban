"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createReport } from "@/server/reports";
import { ImageUploader } from "@/components/upload/image-uploader";
import { Button } from "@/components/ui/button";
import { ReportCategory, ReportPriority } from "@prisma/client";
import { UI_TEXT } from "@/lib/constants";
import { AlertCircle } from "lucide-react";

export default function NewReportPage() {
  const router = useRouter();

  const [category, setCategory] = useState<ReportCategory>(ReportCategory.BUILDING);
  const [priority, setPriority] = useState<ReportPriority>(ReportPriority.MEDIUM);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [attachmentKeys, setAttachmentKeys] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (attachmentKeys.length === 0) {
      setErrorMessage(UI_TEXT.beforePhotoRequired);
      return;
    }

    setLoading(true);

    try {
      const res = await createReport({
        category,
        priority,
        title,
        description,
        locationDetail,
        attachmentKeys,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal membuat laporan.");
        setLoading(false);
      } else {
        router.push("/reports");
        router.refresh();
      }
    } catch {
      setErrorMessage(UI_TEXT.serverError);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917]">
          Buat Laporan Baru
        </h1>
        <p className="text-xs text-[#57534E] mt-1">
          Laporkan permasalahan gedung, katering, atau sarpras lengkap dengan bukti foto
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B]">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" strokeWidth={1.5} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#E7E5E4] rounded-xl p-6 space-y-5 shadow-sm">
        {/* Kategori */}
        <div>
          <label className="block text-xs font-semibold text-[#1C1917] mb-2">
            Kategori Laporan
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: ReportCategory.BUILDING, label: "Gedung" },
              { id: ReportCategory.CATERING, label: "Catering" },
              { id: ReportCategory.FACILITY, label: "Sarpras" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  category === cat.id
                    ? "bg-[#1E293B] text-white border-[#1E293B]"
                    : "bg-[#FAFAF9] text-[#1C1917] border-[#E7E5E4] hover:bg-[#F5F5F4]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prioritas */}
        <div>
          <label className="block text-xs font-semibold text-[#1C1917] mb-2">
            Prioritas Penanganan
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: ReportPriority.LOW, label: "Rendah" },
              { id: ReportPriority.MEDIUM, label: "Sedang" },
              { id: ReportPriority.HIGH, label: "Tinggi" },
            ].map((prio) => (
              <button
                key={prio.id}
                type="button"
                onClick={() => setPriority(prio.id)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                  priority === prio.id
                    ? "bg-[#1E293B] text-white border-[#1E293B]"
                    : "bg-[#FAFAF9] text-[#1C1917] border-[#E7E5E4] hover:bg-[#F5F5F4]"
                }`}
              >
                {prio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Judul */}
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-[#1C1917] mb-1">
            Judul Singkat Masalah
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: AC bocor di ruang rapat lantai 2"
            maxLength={120}
            className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
          />
          <span className="text-[10px] text-[#57534E] mt-0.5 block text-right">
            {title.length}/120 karakter (minimal 5)
          </span>
        </div>

        {/* Lokasi */}
        <div>
          <label htmlFor="location" className="block text-xs font-semibold text-[#1C1917] mb-1">
            Detail Lokasi Kejadian
          </label>
          <input
            id="location"
            type="text"
            required
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder="Contoh: Gedung Utama Lantai 3, Toilet Pria Dekat Lift"
            maxLength={120}
            className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-[#1C1917] mb-1">
            Deskripsi Rinci Permasalahan
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan kondisi kerusakan atau kendala yang terjadi secara lengkap..."
            maxLength={2000}
            className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
          />
        </div>

        {/* Upload Foto Bukti Awal */}
        <div>
          <label className="block text-xs font-semibold text-[#1C1917] mb-1">
            Foto Bukti Awal (Wajib 1 - 5 Foto)
          </label>
          <p className="text-[11px] text-[#57534E] mb-2">
            Peringatan privasi: Mohon tidak memotret wajah orang atau berkas pribadi yang tidak terkait.
          </p>
          <ImageUploader
            maxPhotos={5}
            onKeysChange={(keys: string[]) => setAttachmentKeys(keys)}
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E7E5E4]">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            {UI_TEXT.cancel}
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {UI_TEXT.submitReport}
          </Button>
        </div>
      </form>
    </div>
  );
}
