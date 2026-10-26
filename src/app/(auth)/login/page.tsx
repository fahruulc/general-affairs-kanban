"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { UI_TEXT } from "../../../lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");

  // Sanitize callbackUrl: ignore if missing, unsafe, or pointing to change-password/login
  const callbackUrl =
    rawCallbackUrl &&
    rawCallbackUrl.startsWith("/") &&
    !rawCallbackUrl.includes("/change-password") &&
    !rawCallbackUrl.includes("/login")
      ? rawCallbackUrl
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(UI_TEXT.invalidCredentials);
        setLoading(false);
      } else {
        // Full navigation ensures fresh session cookies are recognized by proxy middleware
        window.location.href = callbackUrl;
      }
    } catch {
      setErrorMessage(UI_TEXT.serverError);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-[#E7E5E4] p-8 shadow-sm">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">
          Lapor GA
        </h1>
        <p className="text-[11px] text-[#78716C] mt-1">
          Supported by{" "}
          <a
            href="https://manoascale.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#57534E] hover:text-[#1C1917] hover:underline"
          >
            Manoa Scale
          </a>
        </p>
        <p className="text-xs text-[#57534E] mt-3">
          Masuk dengan akun terdaftar Anda
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-[#1C1917] mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-white text-[#1C1917]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-[#1C1917] mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
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

        <Button
          type="submit"
          isLoading={loading}
          className="w-full mt-2"
        >
          {UI_TEXT.login}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF9]">
      <Suspense fallback={<div className="text-xs text-[#57534E]">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
