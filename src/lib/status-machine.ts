import { ReportStatus, Role } from "@prisma/client";

export interface StatusTransitionContext {
  actor: {
    id: string;
    role: Role;
  };
  report: {
    assigneeId: string | null;
    afterAttachmentCount: number;
    startedAt: Date | null;
  };
  note?: string | null;
  rejectionReason?: string | null;
  resolutionNote?: string | null;
}

export interface TransitionValidationResult {
  allowed: boolean;
  error?: string;
  newAssigneeId?: string | null; // undefined means keep current, null means clear, string means assign
  shouldSetStartedAt?: boolean;
  shouldSetCompletedAt?: boolean;
  shouldClearCompletedAt?: boolean;
}

/**
 * Pure state machine enforcing the state transitions defined in PRD Section 7.
 */
export function validateStatusTransition(
  fromStatus: ReportStatus,
  toStatus: ReportStatus,
  context: StatusTransitionContext
): TransitionValidationResult {
  const { actor, report, note, rejectionReason, resolutionNote } = context;
  const isAdmin = actor.role === Role.ADMIN;
  const isOfficer = actor.role === Role.OFFICER;
  const isAssignee = report.assigneeId === actor.id;

  // Cannot transition to the same status
  if (fromStatus === toStatus) {
    return {
      allowed: false,
      error: `Laporan sudah berada dalam status ${fromStatus}.`,
    };
  }

  // 1. NEW -> IN_PROGRESS
  if (fromStatus === ReportStatus.NEW && toStatus === ReportStatus.IN_PROGRESS) {
    if (!isAdmin && !isOfficer) {
      return {
        allowed: false,
        error: "Hanya Petugas atau Admin yang dapat memproses laporan baru.",
      };
    }
    // Syarat: Jika belum ada penanggung jawab, pelaku otomatis menjadi penanggung jawab
    const newAssigneeId = report.assigneeId ? report.assigneeId : actor.id;
    return {
      allowed: true,
      newAssigneeId,
      shouldSetStartedAt: !report.startedAt,
    };
  }

  // 2. NEW -> REJECTED
  if (fromStatus === ReportStatus.NEW && toStatus === ReportStatus.REJECTED) {
    if (!isAdmin && !isOfficer) {
      return {
        allowed: false,
        error: "Hanya Petugas atau Admin yang dapat menolak laporan.",
      };
    }
    const reason = rejectionReason || note;
    if (!reason || reason.trim().length === 0) {
      return {
        allowed: false,
        error: "Alasan penolakan wajib diisi.",
      };
    }
    return {
      allowed: true,
    };
  }

  // 3. IN_PROGRESS -> DONE
  if (fromStatus === ReportStatus.IN_PROGRESS && toStatus === ReportStatus.DONE) {
    if (!isAdmin && !isAssignee) {
      return {
        allowed: false,
        error: "Hanya penanggung jawab laporan atau Admin yang dapat menandai laporan selesai.",
      };
    }
    const noteText = resolutionNote || note;
    if (!noteText || noteText.trim().length === 0) {
      return {
        allowed: false,
        error: "Catatan penyelesaian wajib diisi saat menyelesaikan laporan.",
      };
    }
    if (report.afterAttachmentCount < 1) {
      return {
        allowed: false,
        error: "Minimal satu foto bukti penyelesaian (AFTER) wajib diunggah sebelum menandai selesai.",
      };
    }
    return {
      allowed: true,
      shouldSetCompletedAt: true,
    };
  }

  // 4. IN_PROGRESS -> NEW
  if (fromStatus === ReportStatus.IN_PROGRESS && toStatus === ReportStatus.NEW) {
    if (!isAdmin && !isAssignee) {
      return {
        allowed: false,
        error: "Hanya penanggung jawab laporan atau Admin yang dapat mengembalikan laporan ke status Baru.",
      };
    }
    // Syarat: Penanggung jawab dikosongkan
    return {
      allowed: true,
      newAssigneeId: null,
    };
  }

  // 5. IN_PROGRESS -> REJECTED
  if (fromStatus === ReportStatus.IN_PROGRESS && toStatus === ReportStatus.REJECTED) {
    if (!isAdmin && !isAssignee) {
      return {
        allowed: false,
        error: "Hanya penanggung jawab laporan atau Admin yang dapat menolak laporan yang sedang diproses.",
      };
    }
    const reason = rejectionReason || note;
    if (!reason || reason.trim().length === 0) {
      return {
        allowed: false,
        error: "Alasan penolakan wajib diisi.",
      };
    }
    return {
      allowed: true,
    };
  }

  // 6. DONE -> IN_PROGRESS (Reopen)
  if (fromStatus === ReportStatus.DONE && toStatus === ReportStatus.IN_PROGRESS) {
    if (!isAdmin) {
      return {
        allowed: false,
        error: "Hanya Admin yang memiliki hak untuk membuka kembali laporan yang sudah selesai.",
      };
    }
    if (!note || note.trim().length === 0) {
      return {
        allowed: false,
        error: "Catatan alasan pembukaan kembali laporan wajib diisi.",
      };
    }
    return {
      allowed: true,
      shouldClearCompletedAt: true,
    };
  }

  // 7. REJECTED -> NEW (Reactivate)
  if (fromStatus === ReportStatus.REJECTED && toStatus === ReportStatus.NEW) {
    if (!isAdmin) {
      return {
        allowed: false,
        error: "Hanya Admin yang memiliki hak untuk mengaktifkan kembali laporan yang ditolak.",
      };
    }
    return {
      allowed: true,
      newAssigneeId: null,
    };
  }

  // Any other transition is explicitly prohibited
  return {
    allowed: false,
    error: `Transisi status dari ${fromStatus} ke ${toStatus} tidak diizinkan oleh sistem.`,
  };
}
