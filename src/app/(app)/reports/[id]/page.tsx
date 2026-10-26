import { notFound } from "next/navigation";
import { getReportById } from "../../../../server/reports";
import { requireUser } from "../../../../server/auth";
import { ReportDetailView } from "./report-detail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const res = await getReportById(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <ReportDetailView report={res.data} currentUser={user} />;
}
