import { requireUser } from "../../../server/auth";
import prisma from "../../../lib/db";
import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const dept = user.departmentId
    ? await prisma.department.findUnique({
        where: { id: user.departmentId },
        select: { name: true },
      })
    : null;

  return <ProfileView user={user} departmentName={dept?.name} />;
}
