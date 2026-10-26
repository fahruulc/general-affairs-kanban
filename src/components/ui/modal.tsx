"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-xl border border-[#E7E5E4] shadow-lg p-6 z-10`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#E7E5E4]">
          <div>
            <h3 className="text-base font-semibold text-[#1C1917]">{title}</h3>
            {description && (
              <p className="text-xs text-[#57534E] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#57534E] hover:text-[#1C1917] p-1 rounded-md transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
