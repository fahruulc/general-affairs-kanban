import { notFound } from "next/navigation";
import { requireUser } from "../../../../server/auth";
import { listUsers, getDepartments } from "../../../../server/users";
import { canManageUsers } from "../../../../lib/permissions";
import { UsersManagementView } from "./users-management-view";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: Role;
    isActive?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const user = await requireUser();

  if (!canManageUsers(user)) {
    notFound();
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const role = params.role;
  const isActive =
    params.isActive === "true"
      ? true
      : params.isActive === "false"
      ? false
      : undefined;

  const [usersRes, deptsRes] = await Promise.all([
    listUsers({
      page,
      search,
      role,
      isActive,
    }),
    getDepartments(),
  ]);

  return (
    <UsersManagementView
      users={usersRes.data || []}
      departments={deptsRes.data || []}
      pagination={
        usersRes.pagination || { page: 1, totalPages: 1, totalCount: 0, pageSize: 20 }
      }
      currentUser={user}
      searchParams={{ search, role, isActive: params.isActive }}
    />
  );
}
