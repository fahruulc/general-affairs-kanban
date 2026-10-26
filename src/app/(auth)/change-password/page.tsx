"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { changePasswordAction } from "../../../server/auth";
import { Button } from "../../../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { UI_TEXT } from "../../../lib/constants";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal mengubah password.");
        setLoading(false);
      } else {
        setSuccessMessage("Password berhasil diganti. Menyiapkan sesi Anda...");

        // Re-authenticate silently to obtain fresh JWT cookie with mustChangePassword = false
        if (res.email) {
          await signIn("credentials", {
            email: res.email,
            password: newPassword,
            redirect: false,
          });
        }

        const targetUrl =
          res.role === "ADMIN"
            ? "/dashboard"
            : res.role === "OFFICER"
            ? "/board"
            : "/reports";

        // Full page redirect ensures new cookie is transmitted and proxy allows entry
        window.location.href = targetUrl;
      }
    } catch {
      setErrorMessage(UI_TEXT.serverError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF9]">
      <div className="w-full max-w-sm bg-white rounded-xl border border-[#E7E5E4] p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-[#1C1917]">
            Ganti Password
          </h1>
          <p className="text-xs text-[#57534E] mt-1">
            {UI_TEXT.mustChangePasswordPrompt}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-xs text-[#166534]">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-xs font-medium text-[#1C1917] mb-1"
            >
              Password Saat Ini
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-white text-[#1C1917]"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs font-medium text-[#1C1917] mb-1"
            >
              Password Baru (minimal 8 karakter)
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-white text-[#1C1917] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#57534E] hover:text-[#1C1917]"
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-medium text-[#1C1917] mb-1"
            >
              Konfirmasi Password Baru
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-white text-[#1C1917]"
            />
          </div>

          <Button type="submit" isLoading={loading} className="w-full mt-2">
            Simpan Password Baru
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-[#57534E] hover:text-[#1C1917] hover:underline transition-colors"
            >
              Keluar dan ganti akun
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
