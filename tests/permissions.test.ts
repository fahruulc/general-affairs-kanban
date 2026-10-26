import { describe, it, expect } from "vitest";
import {
  canViewReportDetail,
  canEditReport,
  canCommentOnReport,
  canViewKanban,
  canClaimReport,
  canAssignReport,
  canUploadAfterPhoto,
  canManageUsers,
  canDeactivateUser,
  canChangeUserRole,
} from "../src/lib/permissions";
import { Role, ReportStatus } from "@prisma/client";

describe("Permissions Matrix (PRD Section 4.1)", () => {
  const employeeUser = { id: "emp-1", role: Role.EMPLOYEE };
  const otherEmployeeUser = { id: "emp-2", role: Role.EMPLOYEE };
  const officerUser = { id: "off-1", role: Role.OFFICER };
  const adminUser = { id: "adm-1", role: Role.ADMIN };

  const ownReport = {
    id: "rep-1",
    reporterId: "emp-1",
    assigneeId: null,
    status: ReportStatus.NEW,
  };

  const otherReport = {
    id: "rep-2",
    reporterId: "emp-2",
    assigneeId: "off-1",
    status: ReportStatus.IN_PROGRESS,
  };

  // 1. canViewReportDetail
  describe("canViewReportDetail", () => {
    it("allows employee to view own report", () => {
      expect(canViewReportDetail(employeeUser, ownReport)).toBe(true);
    });

    it("STRICTLY BLOCKS employee from viewing others' reports (Success Metric 63)", () => {
      expect(canViewReportDetail(employeeUser, otherReport)).toBe(false);
    });

    it("allows officer and admin to view any report", () => {
      expect(canViewReportDetail(officerUser, ownReport)).toBe(true);
      expect(canViewReportDetail(officerUser, otherReport)).toBe(true);
      expect(canViewReportDetail(adminUser, ownReport)).toBe(true);
      expect(canViewReportDetail(adminUser, otherReport)).toBe(true);
    });
  });

  // 2. canEditReport
  describe("canEditReport", () => {
    it("allows employee to edit own report only if status is NEW", () => {
      expect(canEditReport(employeeUser, ownReport)).toBe(true);
      expect(
        canEditReport(employeeUser, {
          ...ownReport,
          status: ReportStatus.IN_PROGRESS,
        })
      ).toBe(false);
    });

    it("blocks employee from editing another user's report", () => {
      expect(canEditReport(employeeUser, otherReport)).toBe(false);
    });

    it("blocks officer from editing report details", () => {
      expect(canEditReport(officerUser, ownReport)).toBe(false);
    });

    it("allows admin to edit anytime", () => {
      expect(canEditReport(adminUser, ownReport)).toBe(true);
      expect(canEditReport(adminUser, otherReport)).toBe(true);
    });
  });

  // 3. canCommentOnReport
  describe("canCommentOnReport", () => {
    it("allows employee to comment on own report", () => {
      expect(canCommentOnReport(employeeUser, ownReport)).toBe(true);
    });

    it("blocks employee from commenting on others' report", () => {
      expect(canCommentOnReport(employeeUser, otherReport)).toBe(false);
    });

    it("allows officer and admin to comment on all reports", () => {
      expect(canCommentOnReport(officerUser, ownReport)).toBe(true);
      expect(canCommentOnReport(adminUser, ownReport)).toBe(true);
    });
  });

  // 4. canViewKanban
  describe("canViewKanban", () => {
    it("blocks employee from viewing kanban board", () => {
      expect(canViewKanban(employeeUser)).toBe(false);
    });

    it("allows officer and admin to view kanban board", () => {
      expect(canViewKanban(officerUser)).toBe(true);
      expect(canViewKanban(adminUser)).toBe(true);
    });
  });

  // 5. canClaimReport
  describe("canClaimReport", () => {
    it("allows officer and admin to claim NEW unassigned report", () => {
      expect(canClaimReport(officerUser, ownReport)).toBe(true);
      expect(canClaimReport(adminUser, ownReport)).toBe(true);
    });

    it("blocks claim if report already has assignee or is not NEW", () => {
      expect(canClaimReport(officerUser, otherReport)).toBe(false);
    });

    it("blocks employee from claiming report", () => {
      expect(canClaimReport(employeeUser, ownReport)).toBe(false);
    });
  });

  // 6. canAssignReport
  describe("canAssignReport", () => {
    it("only allows admin to assign reports to other officers", () => {
      expect(canAssignReport(adminUser)).toBe(true);
      expect(canAssignReport(officerUser)).toBe(false);
      expect(canAssignReport(employeeUser)).toBe(false);
    });
  });

  // 7. canUploadAfterPhoto
  describe("canUploadAfterPhoto", () => {
    it("allows assignee officer to upload AFTER photo while IN_PROGRESS", () => {
      expect(canUploadAfterPhoto(officerUser, otherReport)).toBe(true);
    });

    it("blocks non-assignee officer from uploading AFTER photo", () => {
      const nonAssignee = { id: "off-99", role: Role.OFFICER };
      expect(canUploadAfterPhoto(nonAssignee, otherReport)).toBe(false);
    });

    it("allows admin to upload AFTER photo", () => {
      expect(canUploadAfterPhoto(adminUser, otherReport)).toBe(true);
    });
  });

  // 8. User Management Constraints (FR-USER-03, FR-USER-05)
  describe("User Management Rules", () => {
    it("allows admin to manage users", () => {
      expect(canManageUsers(adminUser)).toBe(true);
      expect(canManageUsers(officerUser)).toBe(false);
      expect(canManageUsers(employeeUser)).toBe(false);
    });

    it("blocks admin from deactivating self", () => {
      expect(canDeactivateUser(adminUser, adminUser.id)).toBe(false);
      expect(canDeactivateUser(adminUser, "other-user")).toBe(true);
    });

    it("blocks admin from demoting self to non-admin role", () => {
      expect(canChangeUserRole(adminUser, adminUser.id, Role.OFFICER)).toBe(false);
      expect(canChangeUserRole(adminUser, adminUser.id, Role.EMPLOYEE)).toBe(false);
      expect(canChangeUserRole(adminUser, adminUser.id, Role.ADMIN)).toBe(true);
      expect(canChangeUserRole(adminUser, "other-user", Role.OFFICER)).toBe(true);
    });
  });
});
