"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { updateProfileAction, changePasswordAction } from "../../../server/auth";
import { Avatar } from "../../../components/ui/avatar";
import { RoleBadge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { UI_TEXT } from "../../../lib/constants";

interface ProfileViewProps {
  user: any;
  departmentName?: string;
}

export function ProfileView({ user, departmentName }: ProfileViewProps) {
  const router = useRouter();

  // Profile edit form state
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      const res = await updateProfileAction({ name, phone });
      if (!res.success) {
        setProfileError(res.error || "Gagal memperbarui profil.");
      } else {
        setProfileSuccess(true);
        router.refresh();
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(false);
    setPasswordError("");

    try {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setPasswordError(res.error || "Gagal mengubah password.");
      } else {
        if (res.email) {
          await signIn("credentials", {
            email: res.email,
            password: newPassword,
            redirect: false,
          });
        }
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917]">
          Profil Pengguna
        </h1>
        <p className="text-xs text-[#57534E] mt-1">
          Kelola data pribadi dan keamanan akun Anda
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-[#1C1917]">
                {user.name}
              </h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs text-[#57534E] mt-0.5">{user.email}</p>
            {departmentName && (
              <p className="text-xs text-[#57534E] mt-0.5">
                Departemen: {departmentName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-[#1C1917]">
          Informasi Kontak
        </h2>

        {profileSuccess && (
          <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-xs text-[#166534] flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Profil berhasil diperbarui.
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Nomor Telepon
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={profileLoading}>
              Simpan Data
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-[#1C1917]">
          Keamanan & Password
        </h2>

        {passwordSuccess && (
          <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg text-xs text-[#166534] flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Password berhasil diperbarui.
          </div>
        )}

        {passwordError && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Password Baru (minimal 8 karakter)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917] pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[#57534E] hover:text-[#1C1917]"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={passwordLoading}>
              Ubah Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
