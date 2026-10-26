"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserActive,
  createDepartment,
} from "../../../../server/users";
import { RoleBadge } from "../../../../components/ui/badge";
import { Avatar } from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { Modal } from "../../../../components/ui/modal";
import { formatDate } from "../../../../lib/format";
import { UI_TEXT } from "../../../../lib/constants";
import { Role } from "@prisma/client";
import {
  Plus,
  Pencil,
  KeyRound,
  UserCheck,
  UserX,
  Search,
  Filter,
  Building,
} from "lucide-react";

interface UsersManagementViewProps {
  users: any[];
  departments: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  currentUser: any;
  searchParams: {
    search?: string;
    role?: Role;
    isActive?: string;
  };
}

export function UsersManagementView({
  users,
  departments,
  pagination,
  currentUser,
  searchParams,
}: UsersManagementViewProps) {
  const router = useRouter();

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null);

  // Form states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [phone, setPhone] = useState("");
  const [deptName, setDeptName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const openCreateModal = () => {
    setName("");
    setEmail("");
    setEmployeeNo("");
    setDepartmentId(departments[0]?.id || "");
    setRole(Role.EMPLOYEE);
    setPhone("");
    setErrorMsg("");
    setCreateModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    setName(u.name);
    setEmail(u.email);
    setEmployeeNo(u.employeeNo || "");
    setDepartmentId(u.department?.id || "");
    setRole(u.role);
    setPhone(u.phone || "");
    setErrorMsg("");
    setEditModalOpen(true);
  };

  // 1. Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await createUser({
        name,
        email,
        employeeNo: employeeNo || null,
        departmentId: departmentId || null,
        phone: phone || null,
        role,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal membuat pengguna.");
      } else {
        setCreateModalOpen(false);
        setTempPasswordModal(res.temporaryPassword || null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Update User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await updateUser(selectedUser.id, {
        name,
        employeeNo: employeeNo || null,
        departmentId: departmentId || null,
        phone: phone || null,
        role,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal memperbarui pengguna.");
      } else {
        setEditModalOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset Password
  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Reset password untuk pengguna ${userName}? Password baru akan ditampilkan sekali.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await resetUserPassword(userId);
      if (!res.success) {
        alert(res.error || "Gagal mereset password.");
      } else {
        setTempPasswordModal(res.temporaryPassword || null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. Toggle Active
  const handleToggleActive = async (userId: string, currentStatus: boolean, userName: string) => {
    const actionLabel = currentStatus ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun ${userName}?`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await toggleUserActive(userId, !currentStatus);
      if (!res.success) {
        alert(res.error || `Gagal ${actionLabel} pengguna.`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // 5. Create Department
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await createDepartment(deptName.trim());
      if (!res.success) {
        setErrorMsg(res.error || "Gagal menambahkan departemen.");
      } else {
        setDeptModalOpen(false);
        setDeptName("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1917]">
            Manajemen Pengguna
          </h1>
          <p className="text-xs text-[#57534E] mt-1">
            Kelola akun karyawan, petugas GA, atasan, dan departemen
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setDeptModalOpen(true)}>
            <Building className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
            Tambah Departemen
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#57534E]" strokeWidth={1.5} />
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ""}
              placeholder="Cari nama, email, atau nomor induk..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div>
            <select
              name="role"
              defaultValue={searchParams.role || ""}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            >
              <option value="">Semua Peran</option>
              <option value="ADMIN">Admin</option>
              <option value="OFFICER">Petugas</option>
              <option value="EMPLOYEE">Karyawan</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <select
              name="isActive"
              defaultValue={searchParams.isActive || ""}
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
            <Button type="submit" variant="secondary" size="sm">
              <Filter className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF9] text-[#57534E] border-b border-[#E7E5E4]">
              <tr>
                <th className="px-6 py-3 font-medium">Pengguna</th>
                <th className="px-6 py-3 font-medium">Nomor Induk</th>
                <th className="px-6 py-3 font-medium">Departemen</th>
                <th className="px-6 py-3 font-medium">Peran</th>
                <th className="px-6 py-3 font-medium">Status Akun</th>
                <th className="px-6 py-3 font-medium">Tanggal Dibuat</th>
                <th className="px-6 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div className="font-semibold text-[#1C1917] flex items-center">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] bg-[#E0E7FF] text-[#3730A3] px-1.5 py-0.2 rounded">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[#57534E] text-[11px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#1C1917]">
                      {u.employeeNo || "-"}
                    </td>
                    <td className="px-6 py-3 text-[#57534E]">
                      {u.department?.name || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#DCFCE7] text-[#166534]">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#FEE2E2] text-[#991B1B]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-[#57534E]">
                      {formatDate(u.createdAt, false)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1 text-[#57534E] hover:text-[#1C1917] rounded transition-colors"
                          title="Ubah Data"
                          aria-label="Ubah Data"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>

                        <button
                          onClick={() => handleResetPassword(u.id, u.name)}
                          className="p-1 text-[#57534E] hover:text-[#1C1917] rounded transition-colors"
                          title="Reset Password"
                          aria-label="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                        </button>

                        {!isSelf && (
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive, u.name)}
                            className={`p-1 rounded transition-colors ${
                              u.isActive
                                ? "text-red-600 hover:text-red-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={u.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            aria-label={u.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                          >
                            {u.isActive ? (
                              <UserX className="w-4 h-4" strokeWidth={1.5} />
                            ) : (
                              <UserCheck className="w-4 h-4" strokeWidth={1.5} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tambah Pengguna Baru"
        description="Sistem akan menghasilkan password sementara acak yang wajib diganti pengguna saat login pertama kali."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Pratama"
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Alamat Email (Unik)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@perusahaan.com"
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Nomor Induk Karyawan
              </label>
              <input
                type="text"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                placeholder="EMP-102"
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Departemen
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              >
                <option value="">Pilih Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Peran Akun
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              >
                <option value="EMPLOYEE">Karyawan</option>
                <option value="OFFICER">Petugas GA</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={loading}
            >
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Ubah Data Pengguna"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B]">
              {errorMsg}
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Nomor Induk
              </label>
              <input
                type="text"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Telepon
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Departemen
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
              >
                <option value="">Pilih Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Peran Akun
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={selectedUser?.id === currentUser.id}
                className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917] disabled:opacity-50"
              >
                <option value="EMPLOYEE">Karyawan</option>
                <option value="OFFICER">Petugas GA</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={loading}
            >
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Display Temporary Password (FR-USER-02: Ditampilkan satu kali kepada admin) */}
      <Modal
        isOpen={!!tempPasswordModal}
        onClose={() => setTempPasswordModal(null)}
        title="Password Sementara Pengguna"
        description="Salin password sementara berikut dan berikan kepada pengguna. Password ini hanya ditampilkan satu kali."
      >
        <div className="p-4 bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl text-center space-y-2">
          <div className="text-xs text-[#57534E]">Password Sementara:</div>
          <div className="text-lg font-mono font-semibold tracking-wider text-[#1C1917] bg-white p-2.5 rounded-lg border border-[#E7E5E4] select-all">
            {tempPasswordModal}
          </div>
          <p className="text-[11px] text-[#57534E]">
            Pengguna akan diminta mengganti password ini saat pertama kali login ke sistem.
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#E7E5E4] mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setTempPasswordModal(null)}
          >
            Selesai
          </Button>
        </div>
      </Modal>

      {/* Modal: Add Department */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Tambah Departemen Baru"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Nama Departemen
            </label>
            <input
              type="text"
              required
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="Contoh: Logistik dan Gudang"
              className="w-full px-3 py-2 text-xs border border-[#E7E5E4] rounded-lg focus:outline-none focus:border-[#1E293B] bg-[#FAFAF9] text-[#1C1917]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeptModalOpen(false)}
              disabled={loading}
            >
              {UI_TEXT.cancel}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}>
              Simpan Departemen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
