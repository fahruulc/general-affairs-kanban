import { redirect } from "next/navigation";
import { auth } from "../auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role === "ADMIN") {
    redirect("/dashboard");
  }
  if (role === "OFFICER") {
    redirect("/board");
  }

  redirect("/reports");
}
