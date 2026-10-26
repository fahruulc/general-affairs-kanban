"use client";

import React, { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Loader2, Camera } from "lucide-react";
import { compressImage } from "../../lib/image-compression";
import { APP_CONFIG } from "../../lib/constants";

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "compressing" | "uploading" | "done" | "error";
  progress: number;
  objectKey?: string;
  error?: string;
}

interface ImageUploaderProps {
  maxPhotos?: number;
  onKeysChange: (keys: string[]) => void;
  disabled?: boolean;
}

export function ImageUploader({
  maxPhotos = APP_CONFIG.maxAttachmentsPerKind,
  onKeysChange,
  disabled = false,
}: ImageUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onKeysChangeRef = useRef(onKeysChange);
  onKeysChangeRef.current = onKeysChange;

  const lastEmittedKeysRef = useRef<string[]>([]);

  // Sync uploaded keys to parent safely after render
  useEffect(() => {
    const doneKeys = items
      .filter((it) => it.status === "done" && Boolean(it.objectKey))
      .map((it) => it.objectKey as string);

    const prevKeys = lastEmittedKeysRef.current;
    const isSame =
      prevKeys.length === doneKeys.length &&
      prevKeys.every((k, i) => k === doneKeys[i]);

    if (!isSame) {
      lastEmittedKeysRef.current = doneKeys;
      onKeysChangeRef.current(doneKeys);
    }
  }, [items]);

  const handleFiles = async (files: FileList | File[]) => {
    const remainingSlots = maxPhotos - items.length;
    if (remainingSlots <= 0) return;

    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    const newItems: UploadItem[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "compressing",
      progress: 0,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Process each upload sequentially or concurrently
    for (const item of newItems) {
      await processUpload(item);
    }
  };

  const processUpload = async (item: UploadItem) => {
    try {
      // 1. Compress image in browser (FR-ATT-03)
      const compressed = await compressImage(item.file);

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: "uploading", progress: 10 } : it
        )
      );

      let finalObjectKey: string | null = null;

      // 2. Try direct S3 upload via presigned URL
      try {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: compressed.name,
            contentType: compressed.type || "image/jpeg",
            sizeBytes: compressed.size,
          }),
        });

        if (presignRes.ok) {
          const { uploadUrl, objectKey } = await presignRes.json();

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, progress: 40 } : it
            )
          );

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": compressed.type || "image/jpeg",
            },
            body: compressed,
          });

          if (uploadRes.ok) {
            finalObjectKey = objectKey;
          } else {
            console.warn("[Upload] Direct S3 PUT failed, falling back to server route.");
          }
        }
      } catch (directErr) {
        console.warn("[Upload] Direct S3 PUT threw error (likely CORS):", directErr);
      }

      // 3. Fallback to server-side upload route if direct S3 PUT was blocked by CORS
      if (!finalObjectKey) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, progress: 60 } : it
          )
        );

        const formData = new FormData();
        formData.append("file", compressed);

        const serverRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        if (!serverRes.ok) {
          const errorData = await serverRes.json();
          throw new Error(errorData.error || "Gagal mengunggah foto ke penyimpanan.");
        }

        const data = await serverRes.json();
        finalObjectKey = data.objectKey;
      }

      // Mark done
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "done" as const, progress: 100, objectKey: finalObjectKey || undefined }
            : it
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, status: "error", error: err.message || "Gagal mengunggah." }
            : it
        )
      );
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const isFull = items.length >= maxPhotos;

  return (
    <div className="space-y-3">
      {/* Upload trigger box */}
      {!isFull && !disabled && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#E7E5E4] hover:border-[#1E293B] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#FAFAF9]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-white rounded-full border border-[#E7E5E4] text-[#57534E]">
              <ImagePlus className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-medium text-[#1C1917]">
              Pilih foto atau ambil gambar
            </div>
            <p className="text-xs text-[#57534E]">
              Format JPEG, PNG, WebP (maksimal 5 MB per foto, otomatis dikompres)
            </p>
          </div>
        </div>
      )}

      {/* Thumbnails preview */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg border border-[#E7E5E4] overflow-hidden bg-white group"
            >
              <img
                src={item.previewUrl}
                alt="Pratinjau foto"
                className="w-full h-full object-cover"
              />

              {/* Status overlay */}
              {item.status !== "done" && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-2 text-center text-white text-xs">
                  {item.status === "compressing" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mb-1" strokeWidth={1.5} />
                      <span>Mengompres...</span>
                    </>
                  )}
                  {item.status === "uploading" && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mb-1" strokeWidth={1.5} />
                      <span>Mengunggah...</span>
                    </>
                  )}
                  {item.status === "error" && (
                    <span className="text-red-300 text-xs">Gagal</span>
                  )}
                </div>
              )}

              {/* Delete button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                  aria-label="Hapus foto"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
