import React from "react";
import { ReportStatus, ReportPriority, ReportCategory, Role } from "@prisma/client";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  ROLE_LABELS,
} from "../../lib/constants";
import { Building2, UtensilsCrossed, Wrench } from "lucide-react";

export function StatusBadge({ status }: { status: ReportStatus }) {
  const styles = {
    [ReportStatus.NEW]: "bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]",
    [ReportStatus.IN_PROGRESS]: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    [ReportStatus.DONE]: "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]",
    [ReportStatus.REJECTED]: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ReportPriority }) {
  const styles = {
    [ReportPriority.LOW]: "bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]",
    [ReportPriority.MEDIUM]: "bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE]",
    [ReportPriority.HIGH]: "bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: ReportCategory }) {
  const iconMap = {
    [ReportCategory.BUILDING]: <Building2 className="w-3.5 h-3.5 mr-1 text-[#57534E]" strokeWidth={1.5} />,
    [ReportCategory.CATERING]: <UtensilsCrossed className="w-3.5 h-3.5 mr-1 text-[#57534E]" strokeWidth={1.5} />,
    [ReportCategory.FACILITY]: <Wrench className="w-3.5 h-3.5 mr-1 text-[#57534E]" strokeWidth={1.5} />,
  };

  return (
    <span className="inline-flex items-center text-xs text-[#57534E] font-medium">
      {iconMap[category]}
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const styles = {
    [Role.ADMIN]: "bg-[#1E293B] text-white",
    [Role.OFFICER]: "bg-[#9A7B4F] text-white",
    [Role.EMPLOYEE]: "bg-[#F1F5F9] text-[#334155]",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
