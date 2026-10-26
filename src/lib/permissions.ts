import { Role, ReportStatus } from "@prisma/client";

export interface UserContext {
  id: string;
  role: Role;
  isActive?: boolean;
}

export interface ReportContext {
  id: string;
  reporterId: string;
  assigneeId?: string | null;
  status?: ReportStatus;
}

/**
 * Access Control Matrix implemented strictly according to PRD Section 4.1
 */

// Lihat daftar laporan
export function canViewReportList(user: UserContext): boolean {
  return true; // All authenticated users can view report list, but employees are filtered to own reports in service layer
}

// Lihat detail dan foto laporan
export function canViewReportDetail(user: UserContext, report: ReportContext): boolean {
  if (user.role === Role.ADMIN || user.role === Role.OFFICER) {
    return true;
  }
  // Employee can only view own reports
  return report.reporterId === user.id;
}

// Ubah isi laporan (judul, deskripsi, foto awal)
// Karyawan: Milik sendiri, hanya saat status Baru. Admin: Ya. Petugas: Tidak.
export function canEditReport(user: UserContext, report: ReportContext): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  if (user.role === Role.EMPLOYEE) {
    return report.reporterId === user.id && report.status === ReportStatus.NEW;
  }
  return false;
}

// Beri komentar
// Karyawan: Pada laporan milik sendiri. Petugas: Semua. Admin: Semua.
export function canCommentOnReport(user: UserContext, report: ReportContext): boolean {
  if (user.role === Role.ADMIN || user.role === Role.OFFICER) {
    return true;
  }
  return report.reporterId === user.id;
}

// Lihat papan kanban
// Karyawan: Tidak. Petugas: Ya. Admin: Ya.
export function canViewKanban(user: UserContext): boolean {
  return user.role === Role.ADMIN || user.role === Role.OFFICER;
}

// Ambil laporan (menjadikan diri penanggung jawab)
// Karyawan: Tidak. Petugas: Ya (status Baru, belum ada penanggung jawab). Admin: Ya.
export function canClaimReport(user: UserContext, report: ReportContext): boolean {
  if (user.role !== Role.ADMIN && user.role !== Role.OFFICER) {
    return false;
  }
  return report.status === ReportStatus.NEW && !report.assigneeId;
}

// Tetapkan penanggung jawab ke petugas lain (hanya Admin)
export function canAssignReport(user: UserContext): boolean {
  return user.role === Role.ADMIN;
}

// Unggah foto penyelesaian (AFTER)
// Karyawan: Tidak. Petugas: Ya (laporan yang ditanganinya). Admin: Ya.
export function canUploadAfterPhoto(user: UserContext, report: ReportContext): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  if (user.role === Role.OFFICER) {
    return report.assigneeId === user.id && report.status === ReportStatus.IN_PROGRESS;
  }
  return false;
}

// Lihat dashboard ringkasan
export function canViewDashboard(user: UserContext): boolean {
  return user.role === Role.ADMIN;
}

// Kelola pengguna dan departemen
export function canManageUsers(user: UserContext): boolean {
  return user.role === Role.ADMIN;
}

// Admin tidak dapat menonaktifkan akunnya sendiri
export function canDeactivateUser(actor: UserContext, targetUserId: string): boolean {
  if (actor.role !== Role.ADMIN) return false;
  return actor.id !== targetUserId;
}

// Admin tidak dapat menurunkan perannya sendiri
export function canChangeUserRole(actor: UserContext, targetUserId: string, newRole: Role): boolean {
  if (actor.role !== Role.ADMIN) return false;
  if (actor.id === targetUserId && newRole !== Role.ADMIN) {
    return false;
  }
  return true;
}
