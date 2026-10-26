"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Columns3,
  FileText,
  Plus,
  Users,
  UserRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Role } from "@prisma/client";
import { Avatar } from "../ui/avatar";
import { RoleBadge } from "../ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5 mr-3" strokeWidth={1.5} />,
    roles: [Role.ADMIN],
  },
  {
    label: "Papan Kanban",
    href: "/board",
    icon: <Columns3 className="w-5 h-5 mr-3" strokeWidth={1.5} />,
    roles: [Role.ADMIN, Role.OFFICER],
  },
  {
    label: "Daftar Laporan",
    href: "/reports",
    icon: <FileText className="w-5 h-5 mr-3" strokeWidth={1.5} />,
    roles: [Role.ADMIN, Role.OFFICER, Role.EMPLOYEE],
  },
  {
    label: "Buat Laporan",
    href: "/reports/new",
    icon: <Plus className="w-5 h-5 mr-3" strokeWidth={1.5} />,
    roles: [Role.ADMIN, Role.OFFICER, Role.EMPLOYEE],
  },
  {
    label: "Pengguna",
    href: "/admin/users",
    icon: <Users className="w-5 h-5 mr-3" strokeWidth={1.5} />,
    roles: [Role.ADMIN],
  },
  {
    label: "Profil",
    href: "/profile",
    icon: <UserRound className="w-5 h-5 mr-3" strokeWidth={1.5} />,
    roles: [Role.ADMIN, Role.OFFICER, Role.EMPLOYEE],
  },
];

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowedNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E7E5E4] w-64">
      {/* Brand Header */}
      <div className="h-16 flex flex-col justify-center px-6 border-b border-[#E7E5E4] flex-shrink-0">
        <Link href="/" className="inline-block">
          <span className="text-lg font-semibold tracking-tight text-[#1C1917]">
            Lapor GA
          </span>
        </Link>
        <p className="text-[10px] text-[#78716C] leading-none mt-1">
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
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allowedNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-[#FAFAF9] text-[#1C1917] border-l-2 border-[#9A7B4F]"
                  : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAFAF9]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-[#E7E5E4] bg-[#FAFAF9] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1917] truncate">
                {user.name}
              </p>
              <div className="mt-0.5">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-[#57534E] hover:text-[#1C1917] rounded-md transition-colors"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden h-14 bg-white border-b border-[#E7E5E4] flex items-center justify-between px-4 sticky top-0 z-30">
        <div>
          <span className="font-semibold text-[#1C1917]">Lapor GA</span>
          <p className="text-[10px] text-[#78716C] leading-none mt-0.5">
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
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#57534E] hover:text-[#1C1917]"
          aria-label="Buka menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" strokeWidth={1.5} />
          ) : (
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 flex-1 max-w-xs w-full bg-white">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-full lg:flex-shrink-0 select-none">
        {navContent}
      </aside>
    </>
  );
}
