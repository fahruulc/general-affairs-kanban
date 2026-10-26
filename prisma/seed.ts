import { PrismaClient, Role, ReportCategory, ReportPriority, ReportStatus, AttachmentKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Departments
  const departmentsData = [
    { name: "Operasional" },
    { name: "Keuangan" },
    { name: "Pemasaran" },
    { name: "Teknologi Informasi" },
  ];

  const departments: Record<string, string> = {};
  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    departments[dept.name] = record.id;
  }
  console.log("Departments seeded:", Object.keys(departments).length);

  // Default hashed password (cost 12): Password123!
  const passwordHash = await bcrypt.hash("Password123!", 12);

  // 2. Seed Users
  // 1 Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@laporga.com" },
    update: {},
    create: {
      employeeNo: "ADM-001",
      name: "Budi Santoso",
      email: "admin@laporga.com",
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567890",
      departmentId: departments["Operasional"],
    },
  });

  // 2 Officers
  const officer1 = await prisma.user.upsert({
    where: { email: "petugas1@laporga.com" },
    update: {},
    create: {
      employeeNo: "OFF-001",
      name: "Ahmad Fauzi",
      email: "petugas1@laporga.com",
      passwordHash,
      role: Role.OFFICER,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567891",
      departmentId: departments["Operasional"],
    },
  });

  const officer2 = await prisma.user.upsert({
    where: { email: "petugas2@laporga.com" },
    update: {},
    create: {
      employeeNo: "OFF-002",
      name: "Siti Rahma",
      email: "petugas2@laporga.com",
      passwordHash,
      role: Role.OFFICER,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567892",
      departmentId: departments["Operasional"],
    },
  });

  // 4 Employees
  const employee1 = await prisma.user.upsert({
    where: { email: "karyawan1@laporga.com" },
    update: {},
    create: {
      employeeNo: "EMP-001",
      name: "Dedi Pratama",
      email: "karyawan1@laporga.com",
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567893",
      departmentId: departments["Keuangan"],
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: "karyawan2@laporga.com" },
    update: {},
    create: {
      employeeNo: "EMP-002",
      name: "Dewi Lestari",
      email: "karyawan2@laporga.com",
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567894",
      departmentId: departments["Pemasaran"],
    },
  });

  const employee3 = await prisma.user.upsert({
    where: { email: "karyawan3@laporga.com" },
    update: {},
    create: {
      employeeNo: "EMP-003",
      name: "Rian Hidayat",
      email: "karyawan3@laporga.com",
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567895",
      departmentId: departments["Teknologi Informasi"],
    },
  });

  const employee4 = await prisma.user.upsert({
    where: { email: "karyawan4@laporga.com" },
    update: {},
    create: {
      employeeNo: "EMP-004",
      name: "Maya Anggraini",
      email: "karyawan4@laporga.com",
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      mustChangePassword: true,
      phone: "081234567896",
      departmentId: departments["Keuangan"],
    },
  });

  console.log("Users seeded successfully.");

  // 3. Seed Reports (10 sample reports)
  const existingReportsCount = await prisma.report.count();
  if (existingReportsCount === 0) {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Report 1: NEW - Building - AC Bocor
    const r1 = await prisma.report.create({
      data: {
        title: "AC bocor di ruang rapat lantai 2",
        description: "Tetesan air cukup deras dari unit AC sisi barat dan membasahi karpet lantai.",
        category: ReportCategory.BUILDING,
        priority: ReportPriority.HIGH,
        status: ReportStatus.NEW,
        locationDetail: "Gedung Utama Lantai 2, Ruang Rapat Merpati",
        reporterId: employee1.id,
        createdAt: threeDaysAgo,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee1.id}/2026/10/demo-ac-bocor.jpg`,
              fileName: "ac-bocor.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 420000,
              uploadedById: employee1.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee1.id,
              createdAt: threeDaysAgo,
            },
          ],
        },
      },
    });

    // Report 2: NEW - Facility - Kursi Kerja Rusak
    await prisma.report.create({
      data: {
        title: "Kursi kerja hidrolik tidak bisa dinaikkan",
        description: "Tuas pengatur tinggi kursi patah dan posisi kursi terkunci paling rendah.",
        category: ReportCategory.FACILITY,
        priority: ReportPriority.MEDIUM,
        status: ReportStatus.NEW,
        locationDetail: "Gedung B Lantai 1, Meja Divisi Pemasaran No 12",
        reporterId: employee2.id,
        createdAt: now,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee2.id}/2026/10/demo-kursi-rusak.jpg`,
              fileName: "kursi-rusak.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 310000,
              uploadedById: employee2.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee2.id,
              createdAt: now,
            },
          ],
        },
      },
    });

    // Report 3: IN_PROGRESS - Building - Lampu Toilet Mati
    const r3 = await prisma.report.create({
      data: {
        title: "Lampu utama toilet pria mati",
        description: "Lampu downlight toilet padam sehingga area wastafel gelap.",
        category: ReportCategory.BUILDING,
        priority: ReportPriority.MEDIUM,
        status: ReportStatus.IN_PROGRESS,
        locationDetail: "Gedung Utama Lantai 3, Toilet Pria Dekat Lift",
        reporterId: employee3.id,
        assigneeId: officer1.id,
        startedAt: twoDaysAgo,
        createdAt: threeDaysAgo,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee3.id}/2026/10/demo-lampu-mati.jpg`,
              fileName: "lampu-mati.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 280000,
              uploadedById: employee3.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee3.id,
              createdAt: threeDaysAgo,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.IN_PROGRESS,
              note: "Laporan diambil oleh petugas Ahmad Fauzi.",
              actorId: officer1.id,
              createdAt: twoDaysAgo,
            },
          ],
        },
        comments: {
          create: [
            {
              body: "Bohlam pengganti sedang diambil dari gudang logistik.",
              authorId: officer1.id,
              createdAt: twoDaysAgo,
            },
          ],
        },
      },
    });

    // Report 4: IN_PROGRESS - Catering - Nasi Kotak Basi
    await prisma.report.create({
      data: {
        title: "Nasi kotak makan siang berbau asam",
        description: "Menu lauk ayam dan tahu pada makan siang hari ini berbau tidak sedap dan tidak layak konsumsi.",
        category: ReportCategory.CATERING,
        priority: ReportPriority.HIGH,
        status: ReportStatus.IN_PROGRESS,
        locationDetail: "Pantry Lantai 2",
        reporterId: employee4.id,
        assigneeId: officer2.id,
        startedAt: now,
        createdAt: now,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee4.id}/2026/10/demo-catering-basi.jpg`,
              fileName: "makanan-basi.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 350000,
              uploadedById: employee4.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee4.id,
              createdAt: now,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.IN_PROGRESS,
              note: "Petugas sedang melakukan klarifikasi ke vendor katering.",
              actorId: officer2.id,
              createdAt: now,
            },
          ],
        },
      },
    });

    // Report 5: DONE - Facility - Proyektor Ruang Rapat
    await prisma.report.create({
      data: {
        title: "Kabel HDMI proyektor ruang meeting utama longgar",
        description: "Tampilan layar proyektor berkedip dan sering putus saat presentasi laptop.",
        category: ReportCategory.FACILITY,
        priority: ReportPriority.MEDIUM,
        status: ReportStatus.DONE,
        locationDetail: "Gedung Utama Lantai 1, Ruang Rapat Garuda",
        resolutionNote: "Kabel HDMI telah diganti dengan kabel baru berpelindung nilon dan koneksi telah dites normal.",
        reporterId: employee1.id,
        assigneeId: officer1.id,
        startedAt: fiveDaysAgo,
        completedAt: threeDaysAgo,
        createdAt: fiveDaysAgo,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee1.id}/2026/10/demo-proyektor-rusak.jpg`,
              fileName: "hdmi-rusak.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 390000,
              uploadedById: employee1.id,
            },
            {
              kind: AttachmentKind.AFTER,
              objectKey: `uploads/${officer1.id}/2026/10/demo-proyektor-selesai.jpg`,
              fileName: "hdmi-baru.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 410000,
              uploadedById: officer1.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee1.id,
              createdAt: fiveDaysAgo,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.IN_PROGRESS,
              note: "Petugas memeriksa kabel di lokasi.",
              actorId: officer1.id,
              createdAt: fiveDaysAgo,
            },
            {
              fromStatus: ReportStatus.IN_PROGRESS,
              toStatus: ReportStatus.DONE,
              note: "Kabel HDMI diganti unit baru dan berfungsi stabil.",
              actorId: officer1.id,
              createdAt: threeDaysAgo,
            },
          ],
        },
        comments: {
          create: [
            {
              body: "Terima kasih atas penanganan cepatnya.",
              authorId: employee1.id,
              createdAt: threeDaysAgo,
            },
          ],
        },
      },
    });

    // Report 6: DONE - Building - Keran Air Wastafel Bocor
    await prisma.report.create({
      data: {
        title: "Keran air wastafel tidak bisa ditutup rapat",
        description: "Air terus mengalir kecil dari keran wastafel dan berpotensi membuang air bersih.",
        category: ReportCategory.BUILDING,
        priority: ReportPriority.LOW,
        status: ReportStatus.DONE,
        locationDetail: "Gedung B Lantai 2, Toilet Karyawan Wanita",
        resolutionNote: "Seal karet keran telah diganti dan keran dapat tertutup rapat kembali tanpa kebocoran.",
        reporterId: employee2.id,
        assigneeId: officer2.id,
        startedAt: fiveDaysAgo,
        completedAt: twoDaysAgo,
        createdAt: fiveDaysAgo,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee2.id}/2026/10/demo-keran-bocor.jpg`,
              fileName: "keran-bocor.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 320000,
              uploadedById: employee2.id,
            },
            {
              kind: AttachmentKind.AFTER,
              objectKey: `uploads/${officer2.id}/2026/10/demo-keran-selesai.jpg`,
              fileName: "keran-selesai.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 330000,
              uploadedById: officer2.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee2.id,
              createdAt: fiveDaysAgo,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.IN_PROGRESS,
              note: "Petugas menyiapkan seal pengganti.",
              actorId: officer2.id,
              createdAt: fiveDaysAgo,
            },
            {
              fromStatus: ReportStatus.IN_PROGRESS,
              toStatus: ReportStatus.DONE,
              note: "Penggantian seal selesai dan dites aman.",
              actorId: officer2.id,
              createdAt: twoDaysAgo,
            },
          ],
        },
      },
    });

    // Report 7: REJECTED - Facility - Permintaan Mouse Gaming Pribadi
    await prisma.report.create({
      data: {
        title: "Permintaan ganti mouse gaming khusus",
        description: "Mohon disediakan mouse nirkabel dengan fitur sensitivitas tinggi untuk pekerjaan desain.",
        category: ReportCategory.FACILITY,
        priority: ReportPriority.LOW,
        status: ReportStatus.REJECTED,
        locationDetail: "Gedung Utama Lantai 2, Meja Kreatif",
        rejectionReason: "Pengadaan peralatan periferal non-standar harus diajukan melalui persetujuan anggaran manajer divisi terkait terlebih dahulu.",
        reporterId: employee3.id,
        createdAt: threeDaysAgo,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee3.id}/2026/10/demo-mouse.jpg`,
              fileName: "mouse.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 250000,
              uploadedById: employee3.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee3.id,
              createdAt: threeDaysAgo,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.REJECTED,
              note: "Ditolak karena di luar prosedur standar fasilitas GA.",
              actorId: admin.id,
              createdAt: twoDaysAgo,
            },
          ],
        },
      },
    });

    // Report 8: NEW - Facility - Gagang Pintu Ruang Server Kendor
    await prisma.report.create({
      data: {
        title: "Gagang pintu ruang server agak kendor",
        description: "Baut pengikat pegangan pintu perlu dikencangkan agar akses kartu RFID tetap presisi.",
        category: ReportCategory.FACILITY,
        priority: ReportPriority.HIGH,
        status: ReportStatus.NEW,
        locationDetail: "Gedung Utama Lantai Basement, Ruang Pusat Data",
        reporterId: employee3.id,
        createdAt: now,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee3.id}/2026/10/demo-pintu-server.jpg`,
              fileName: "pintu-server.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 310000,
              uploadedById: employee3.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee3.id,
              createdAt: now,
            },
          ],
        },
      },
    });

    // Report 9: IN_PROGRESS - Facility - Dispenser Air Galon Mati
    await prisma.report.create({
      data: {
        title: "Dispenser air galon lantai 3 tidak memanaskan air",
        description: "Indikator pemanas menyala namun air yang keluar tetap bersuhu ruangan.",
        category: ReportCategory.FACILITY,
        priority: ReportPriority.LOW,
        status: ReportStatus.IN_PROGRESS,
        locationDetail: "Pantry Gedung Utama Lantai 3",
        reporterId: employee4.id,
        assigneeId: officer1.id,
        startedAt: now,
        createdAt: now,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee4.id}/2026/10/demo-dispenser.jpg`,
              fileName: "dispenser.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 340000,
              uploadedById: employee4.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee4.id,
              createdAt: now,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.IN_PROGRESS,
              note: "Petugas sedang memeriksa sekring dan elemen pemanas dispenser.",
              actorId: officer1.id,
              createdAt: now,
            },
          ],
        },
      },
    });

    // Report 10: DONE - Catering - Porsi Makan Siang Kurang 3 Kotak
    await prisma.report.create({
      data: {
        title: "Kekurangan tiga paket makan siang divisi pemasaran",
        description: "Jumlah staf yang hadir 15 orang namun kiriman katering yang diterima hanya 12 kotak.",
        category: ReportCategory.CATERING,
        priority: ReportPriority.HIGH,
        status: ReportStatus.DONE,
        locationDetail: "Lantai 2 Meja Divisi Pemasaran",
        resolutionNote: "Petugas telah menghubungi vendor katering dan 3 paket susulan telah diantarkan serta diterima staf.",
        reporterId: employee2.id,
        assigneeId: officer2.id,
        startedAt: twoDaysAgo,
        completedAt: twoDaysAgo,
        createdAt: twoDaysAgo,
        attachments: {
          create: [
            {
              kind: AttachmentKind.BEFORE,
              objectKey: `uploads/${employee2.id}/2026/10/demo-katering-kurang.jpg`,
              fileName: "katering-kurang.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 300000,
              uploadedById: employee2.id,
            },
            {
              kind: AttachmentKind.AFTER,
              objectKey: `uploads/${officer2.id}/2026/10/demo-katering-susulan.jpg`,
              fileName: "katering-susulan.jpg",
              mimeType: "image/jpeg",
              sizeBytes: 320000,
              uploadedById: officer2.id,
            },
          ],
        },
        statusLogs: {
          create: [
            {
              fromStatus: null,
              toStatus: ReportStatus.NEW,
              note: "Laporan baru dibuat oleh pelapor.",
              actorId: employee2.id,
              createdAt: twoDaysAgo,
            },
            {
              fromStatus: ReportStatus.NEW,
              toStatus: ReportStatus.IN_PROGRESS,
              note: "Petugas berkoordinasi dengan pengemudi vendor katering.",
              actorId: officer2.id,
              createdAt: twoDaysAgo,
            },
            {
              fromStatus: ReportStatus.IN_PROGRESS,
              toStatus: ReportStatus.DONE,
              note: "Tiga paket susulan telah diterima lengkap.",
              actorId: officer2.id,
              createdAt: twoDaysAgo,
            },
          ],
        },
      },
    });

    console.log("10 sample reports seeded successfully.");
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
