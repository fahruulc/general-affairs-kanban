import { describe, it, expect } from "vitest";
import { createReportSchema } from "../src/lib/validators/reports";
import { createUserSchema } from "../src/lib/validators/users";
import { loginSchema, changePasswordSchema } from "../src/lib/validators/auth";
import { presignUploadSchema } from "../src/lib/validators/uploads";
import { ReportCategory, ReportPriority, Role } from "@prisma/client";

describe("Zod Validators (PRD Section 6)", () => {
  describe("createReportSchema (FR-REP-01)", () => {
    it("accepts valid report payload", () => {
      const valid = {
        category: ReportCategory.BUILDING,
        title: "AC di lantai 2 bocor deras",
        description: "Air menetes ke karpet dan meja kerja sejak pagi hari.",
        locationDetail: "Gedung A Lantai 2",
        priority: ReportPriority.HIGH,
        attachmentKeys: ["uploads/user-1/2026/10/photo1.jpg"],
      };
      const res = createReportSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects title shorter than 5 chars", () => {
      const invalid = {
        category: ReportCategory.BUILDING,
        title: "AC",
        description: "Air menetes ke karpet dan meja kerja sejak pagi hari.",
        locationDetail: "Gedung A Lantai 2",
        attachmentKeys: ["uploads/user-1/2026/10/photo1.jpg"],
      };
      const res = createReportSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("rejects if attachmentKeys is empty", () => {
      const invalid = {
        category: ReportCategory.BUILDING,
        title: "AC di lantai 2 bocor deras",
        description: "Air menetes ke karpet dan meja kerja sejak pagi hari.",
        locationDetail: "Gedung A Lantai 2",
        attachmentKeys: [],
      };
      const res = createReportSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("presignUploadSchema (FR-ATT-02)", () => {
    it("accepts supported image types within 5MB", () => {
      const valid = {
        fileName: "bukti.png",
        contentType: "image/png",
        sizeBytes: 1024 * 1024 * 2, // 2MB
      };
      expect(presignUploadSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects unsupported types like pdf or executable", () => {
      const invalid = {
        fileName: "document.pdf",
        contentType: "application/pdf",
        sizeBytes: 1024 * 1024,
      };
      expect(presignUploadSchema.safeParse(invalid).success).toBe(false);
    });

    it("rejects files larger than 5MB", () => {
      const invalid = {
        fileName: "large.jpg",
        contentType: "image/jpeg",
        sizeBytes: 6 * 1024 * 1024, // 6MB
      };
      expect(presignUploadSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("changePasswordSchema (FR-AUTH-03)", () => {
    it("requires passwords to match", () => {
      const mismatched = {
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword123!",
        confirmPassword: "WrongPassword!",
      };
      const res = changePasswordSchema.safeParse(mismatched);
      expect(res.success).toBe(false);
    });

    it("accepts valid matching passwords", () => {
      const valid = {
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      };
      const res = changePasswordSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });
});
