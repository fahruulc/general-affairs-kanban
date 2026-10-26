import { describe, it, expect } from "vitest";
import { validateStatusTransition } from "../src/lib/status-machine";
import { Role, ReportStatus } from "@prisma/client";

describe("Status Machine Transition Rules (PRD Section 7)", () => {
  const adminActor = { id: "user-admin", role: Role.ADMIN };
  const officerActor = { id: "user-officer-1", role: Role.OFFICER };
  const employeeActor = { id: "user-emp", role: Role.EMPLOYEE };

  // 1. NEW -> IN_PROGRESS
  describe("NEW -> IN_PROGRESS", () => {
    it("allows Officer to process NEW report and assigns them if unassigned", () => {
      const result = validateStatusTransition(
        ReportStatus.NEW,
        ReportStatus.IN_PROGRESS,
        {
          actor: officerActor,
          report: { assigneeId: null, afterAttachmentCount: 0, startedAt: null },
        }
      );
      expect(result.allowed).toBe(true);
      expect(result.newAssigneeId).toBe(officerActor.id);
      expect(result.shouldSetStartedAt).toBe(true);
    });

    it("allows Admin to process NEW report", () => {
      const result = validateStatusTransition(
        ReportStatus.NEW,
        ReportStatus.IN_PROGRESS,
        {
          actor: adminActor,
          report: { assigneeId: null, afterAttachmentCount: 0, startedAt: null },
        }
      );
      expect(result.allowed).toBe(true);
      expect(result.newAssigneeId).toBe(adminActor.id);
    });

    it("rejects Employee from moving NEW to IN_PROGRESS", () => {
      const result = validateStatusTransition(
        ReportStatus.NEW,
        ReportStatus.IN_PROGRESS,
        {
          actor: employeeActor,
          report: { assigneeId: null, afterAttachmentCount: 0, startedAt: null },
        }
      );
      expect(result.allowed).toBe(false);
    });
  });

  // 2. NEW -> REJECTED
  describe("NEW -> REJECTED", () => {
    it("allows Officer to reject NEW report if rejectionReason is provided", () => {
      const result = validateStatusTransition(
        ReportStatus.NEW,
        ReportStatus.REJECTED,
        {
          actor: officerActor,
          report: { assigneeId: null, afterAttachmentCount: 0, startedAt: null },
          rejectionReason: "Bukan kewenangan GA.",
        }
      );
      expect(result.allowed).toBe(true);
    });

    it("blocks rejection if reason is empty", () => {
      const result = validateStatusTransition(
        ReportStatus.NEW,
        ReportStatus.REJECTED,
        {
          actor: officerActor,
          report: { assigneeId: null, afterAttachmentCount: 0, startedAt: null },
          rejectionReason: "",
        }
      );
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Alasan penolakan wajib");
    });
  });

  // 3. IN_PROGRESS -> DONE
  describe("IN_PROGRESS -> DONE", () => {
    it("allows Assignee to complete report with note and at least 1 AFTER attachment", () => {
      const result = validateStatusTransition(
        ReportStatus.IN_PROGRESS,
        ReportStatus.DONE,
        {
          actor: officerActor,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 1,
            startedAt: new Date(),
          },
          resolutionNote: "Pekerjaan selesai.",
        }
      );
      expect(result.allowed).toBe(true);
      expect(result.shouldSetCompletedAt).toBe(true);
    });

    it("blocks completion if AFTER attachment is missing (0 count)", () => {
      const result = validateStatusTransition(
        ReportStatus.IN_PROGRESS,
        ReportStatus.DONE,
        {
          actor: officerActor,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 0,
            startedAt: new Date(),
          },
          resolutionNote: "Pekerjaan selesai.",
        }
      );
      expect(result.allowed).toBe(false);
      expect(result.error).toContain("foto bukti penyelesaian (AFTER)");
    });

    it("blocks completion if non-assignee officer attempts it", () => {
      const anotherOfficer = { id: "user-officer-2", role: Role.OFFICER };
      const result = validateStatusTransition(
        ReportStatus.IN_PROGRESS,
        ReportStatus.DONE,
        {
          actor: anotherOfficer,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 2,
            startedAt: new Date(),
          },
          resolutionNote: "Pekerjaan selesai.",
        }
      );
      expect(result.allowed).toBe(false);
    });

    it("allows Admin to complete even if not assignee", () => {
      const result = validateStatusTransition(
        ReportStatus.IN_PROGRESS,
        ReportStatus.DONE,
        {
          actor: adminActor,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 1,
            startedAt: new Date(),
          },
          resolutionNote: "Diselesaikan oleh atasan.",
        }
      );
      expect(result.allowed).toBe(true);
    });
  });

  // 4. IN_PROGRESS -> NEW
  describe("IN_PROGRESS -> NEW", () => {
    it("clears assignee when returned to NEW", () => {
      const result = validateStatusTransition(
        ReportStatus.IN_PROGRESS,
        ReportStatus.NEW,
        {
          actor: officerActor,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 0,
            startedAt: new Date(),
          },
        }
      );
      expect(result.allowed).toBe(true);
      expect(result.newAssigneeId).toBeNull();
    });
  });

  // 5. DONE -> IN_PROGRESS (Reopen)
  describe("DONE -> IN_PROGRESS", () => {
    it("allows Admin to reopen with note and clears completedAt", () => {
      const result = validateStatusTransition(
        ReportStatus.DONE,
        ReportStatus.IN_PROGRESS,
        {
          actor: adminActor,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 1,
            startedAt: new Date(),
          },
          note: "Masih terdapat kebocoran kecil setelah pengetesan.",
        }
      );
      expect(result.allowed).toBe(true);
      expect(result.shouldClearCompletedAt).toBe(true);
    });

    it("blocks Officer from reopening a DONE report", () => {
      const result = validateStatusTransition(
        ReportStatus.DONE,
        ReportStatus.IN_PROGRESS,
        {
          actor: officerActor,
          report: {
            assigneeId: officerActor.id,
            afterAttachmentCount: 1,
            startedAt: new Date(),
          },
          note: "Ingin membuka kembali.",
        }
      );
      expect(result.allowed).toBe(false);
    });
  });

  // 6. REJECTED -> NEW
  describe("REJECTED -> NEW", () => {
    it("allows Admin to reactivate rejected report", () => {
      const result = validateStatusTransition(
        ReportStatus.REJECTED,
        ReportStatus.NEW,
        {
          actor: adminActor,
          report: {
            assigneeId: null,
            afterAttachmentCount: 0,
            startedAt: null,
          },
        }
      );
      expect(result.allowed).toBe(true);
      expect(result.newAssigneeId).toBeNull();
    });
  });

  // 7. Invalid transitions
  describe("Disallowed transitions", () => {
    it("blocks transition from NEW directly to DONE", () => {
      const result = validateStatusTransition(
        ReportStatus.NEW,
        ReportStatus.DONE,
        {
          actor: adminActor,
          report: { assigneeId: null, afterAttachmentCount: 1, startedAt: null },
          resolutionNote: "Langsung selesai.",
        }
      );
      expect(result.allowed).toBe(false);
    });

    it("blocks transition from DONE directly to REJECTED", () => {
      const result = validateStatusTransition(
        ReportStatus.DONE,
        ReportStatus.REJECTED,
        {
          actor: adminActor,
          report: { assigneeId: null, afterAttachmentCount: 1, startedAt: null },
        }
      );
      expect(result.allowed).toBe(false);
    });
  });
});
