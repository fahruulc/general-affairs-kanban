# PRD: Lapor GA

Aplikasi web pelaporan dan pelacakan permintaan General Affairs (GA) berbasis bukti foto untuk perusahaan menengah.

| Item | Isi |
|---|---|
| Versi dokumen | 1.0 (Draft) |
| Tanggal | 25 Oktober 2026 |
| Tujuan dokumen | Acuan tunggal untuk pengembangan dengan bantuan AI coding assistant, lalu menjadi bahan video tutorial |
| Bahasa antarmuka aplikasi | Bahasa Indonesia |
| Bahasa kode dan nama tabel | Bahasa Inggris |

---

## 1. Ringkasan Produk

Lapor GA adalah aplikasi web tempat karyawan melaporkan masalah terkait gedung, catering, dan sarana prasarana (sarpras) lengkap dengan foto sebagai bukti. Petugas GA menangani laporan melalui papan kanban dan mengunggah foto hasil penyelesaian. Admin (atasan) mengelola pengguna dan memantau seluruh laporan.

Nilai utama produk:

1. Satu tempat resmi untuk semua laporan GA, menggantikan chat dan spreadsheet yang mudah hilang.
2. Bukti foto sebelum dan sesudah tersimpan rapi dan bisa ditelusuri.
3. Progres penanganan terlihat jelas oleh pelapor, petugas, dan atasan.

Produk ini juga berfungsi sebagai studi kasus video tutorial: deployment Next.js ke Vercel dengan PostgreSQL di Supabase dan object storage di Backblaze B2, seluruhnya menggunakan paket gratis. Karena itu keputusan teknis di dokumen ini sengaja dibuat sederhana dan dapat dijelaskan dalam durasi video.

## 2. Latar Belakang dan Masalah

Pada perusahaan menengah, GA biasanya menerima laporan lewat chat, telepon, atau pesan langsung. Akibatnya:

- Laporan tercecer dan sulit dilacak statusnya.
- Tidak ada bukti yang seragam, sehingga sering terjadi perbedaan pendapat soal kondisi sebelum dan sesudah perbaikan.
- Atasan tidak punya gambaran jumlah dan jenis laporan yang masuk.
- Pelapor tidak tahu apakah laporannya sudah dibaca atau sedang dikerjakan.

## 3. Tujuan, Non-Tujuan, dan Indikator Keberhasilan

### 3.1 Tujuan

- Karyawan dapat membuat laporan lengkap dengan foto dalam waktu kurang dari 2 menit.
- Petugas dapat melihat dan memindahkan status laporan melalui papan kanban.
- Setiap laporan yang selesai memiliki minimal satu foto bukti penyelesaian.
- Admin dapat mengelola akun pengguna tanpa menyentuh database.
- Seluruh sistem dapat berjalan lokal dengan Docker dan dapat di-deploy ke layanan gratis.

### 3.2 Non-Tujuan (di luar lingkup versi ini)

- Notifikasi email, WhatsApp, atau push notification.
- Fitur lupa password mandiri lewat email (admin yang mereset password).
- Integrasi SSO atau login sosial.
- Aplikasi mobile native (cukup web responsif).
- Manajemen vendor, anggaran, inventaris, atau pemesanan ruangan.
- Pengurutan manual kartu di dalam kolom kanban.
- Laporan ekspor PDF atau Excel.
- Dukungan multi-bahasa dan mode gelap.

### 3.3 Indikator Keberhasilan (untuk demo dan uji coba)

| Indikator | Target |
|---|---|
| Waktu membuat laporan dengan 2 foto | Kurang dari 2 menit |
| Laporan berstatus Selesai tanpa foto penyelesaian | 0 persen (diblokir sistem) |
| Akses laporan milik orang lain oleh karyawan | 0 kasus (diblokir sistem dan diuji) |
| Seluruh alur utama dapat didemokan di lingkungan produksi gratis | Ya |

## 4. Pengguna dan Peran

| Peran (kode) | Label di UI | Deskripsi |
|---|---|---|
| EMPLOYEE | Karyawan | Pelapor. Membuat laporan dan memantau laporan miliknya. |
| OFFICER | Petugas | Staf GA. Menangani laporan, mengubah status, mengunggah bukti penyelesaian. |
| ADMIN | Admin | Atasan atau admin GA. Memiliki seluruh hak petugas, ditambah manajemen pengguna dan dashboard ringkasan. |

### 4.1 Matriks Hak Akses

| Aksi | Karyawan | Petugas | Admin |
|---|---|---|---|
| Masuk dan keluar | Ya | Ya | Ya |
| Ubah profil dan password sendiri | Ya | Ya | Ya |
| Buat laporan | Ya | Ya | Ya |
| Lihat daftar laporan | Milik sendiri | Semua | Semua |
| Lihat detail dan foto laporan | Milik sendiri | Semua | Semua |
| Ubah isi laporan (judul, deskripsi, foto awal) | Milik sendiri, hanya saat status Baru | Tidak | Ya |
| Beri komentar | Pada laporan milik sendiri | Semua | Semua |
| Lihat papan kanban | Tidak | Ya | Ya |
| Ambil laporan (menjadikan diri penanggung jawab) | Tidak | Ya | Ya |
| Tetapkan penanggung jawab ke petugas lain | Tidak | Tidak | Ya |
| Ubah status laporan | Tidak | Sesuai aturan bagian 7 | Sesuai aturan bagian 7 |
| Unggah foto penyelesaian | Tidak | Ya (laporan yang ditanganinya) | Ya |
| Lihat dashboard ringkasan | Tidak | Tidak | Ya |
| Kelola pengguna dan departemen | Tidak | Tidak | Ya |

## 5. Lingkup Produk

### 5.1 Termasuk (MVP)

Autentikasi multi-role, manajemen pengguna oleh admin, pembuatan laporan dengan lampiran foto pada tiga kategori (Gedung, Catering, Sarpras), daftar dan detail laporan, papan kanban progres, komentar pada laporan, riwayat status, dan dashboard ringkasan untuk admin.

### 5.2 Kategori Laporan

| Kode | Label | Contoh |
|---|---|---|
| BUILDING | Gedung | AC bocor, lampu mati, toilet rusak, plafon jebol, kebersihan |
| CATERING | Catering | Makanan basi, porsi kurang, jadwal terlambat, kebersihan kemasan |
| FACILITY | Sarpras | Kursi atau meja rusak, proyektor bermasalah, kendaraan operasional, peralatan kantor |

### 5.3 Prioritas Pengerjaan (Prioritas Fitur)

Menggunakan skala MoSCoW: M (Must), S (Should), C (Could). Pengerjaan M harus selesai sebelum video direkam.

## 6. Kebutuhan Fungsional

### 6.1 Autentikasi dan Sesi (M)

**FR-AUTH-01 Login.** Masuk dengan email dan password.
- Password disimpan sebagai hash bcrypt (cost 12), tidak pernah disimpan atau dicatat dalam bentuk asli.
- Akun dengan isActive bernilai false ditolak dengan pesan umum yang tidak membocorkan alasan.
- Pesan gagal login tidak membedakan email salah dan password salah.
- Setelah login, pengguna diarahkan ke halaman awal sesuai peran: Karyawan ke Laporan Saya, Petugas ke Papan Kanban, Admin ke Dashboard.

**FR-AUTH-02 Sesi.** Strategi sesi JWT (wajib untuk Credentials provider). Token memuat id pengguna dan peran.

**FR-AUTH-03 Ganti password wajib.** Akun baru atau yang direset admin memiliki mustChangePassword bernilai true. Semua halaman kecuali halaman ganti password dan logout diarahkan ke halaman ganti password sampai password diganti.

**FR-AUTH-04 Proteksi rute.** Rute dilindungi oleh dua lapis: (1) pemeriksaan kasar di proxy atau middleware untuk pengalihan ke login, (2) pemeriksaan ketat di setiap server action dan route handler yang membaca ulang pengguna dari database (isActive dan role) sebelum melakukan apa pun. Perubahan peran atau penonaktifan akun oleh admin harus berlaku pada permintaan berikutnya, bukan menunggu token kedaluwarsa.

**FR-AUTH-05 Pembatasan percobaan login (S).** Batasi percobaan login gagal berturut-turut per email dan per alamat IP. Untuk MVP boleh sederhana, dan harus dicatat sebagai risiko bila belum diterapkan.

### 6.2 Manajemen Pengguna (M, hanya Admin)

**FR-USER-01 Daftar pengguna.** Tabel dengan kolom nama, email, nomor induk, departemen, peran, status aktif, dan tanggal dibuat. Mendukung pencarian (nama atau email), filter peran, filter status, dan pagination 20 baris per halaman.

**FR-USER-02 Tambah pengguna.** Form: nama, email, nomor induk (opsional), departemen (opsional), peran. Sistem membuat password sementara acak yang ditampilkan satu kali kepada admin. Email harus unik.

**FR-USER-03 Ubah pengguna.** Admin dapat mengubah nama, nomor induk, departemen, dan peran.
- Admin tidak dapat menurunkan perannya sendiri atau menonaktifkan akunnya sendiri.
- Sistem harus selalu memiliki minimal satu Admin aktif.

**FR-USER-04 Reset password.** Admin menghasilkan password sementara baru dan mengaktifkan mustChangePassword.

**FR-USER-05 Nonaktifkan dan aktifkan.** Tidak ada penghapusan permanen pengguna, agar riwayat laporan tetap utuh.

**FR-USER-06 Departemen (S).** Admin dapat menambah dan mengubah nama departemen dari halaman pengguna. Departemen awal diisi lewat seed.

### 6.3 Laporan (M)

**FR-REP-01 Buat laporan.** Field:

| Field | Aturan |
|---|---|
| Kategori | Wajib. Gedung, Catering, atau Sarpras |
| Judul | Wajib, 5 sampai 120 karakter |
| Deskripsi | Wajib, 10 sampai 2000 karakter |
| Lokasi | Wajib, 3 sampai 120 karakter (contoh: Gedung A lantai 3, ruang rapat) |
| Prioritas | Wajib, default Sedang |
| Foto bukti | Wajib minimal 1, maksimal 5 |

Setelah tersimpan, laporan berstatus Baru, nomor laporan dibuat otomatis (format GA-00001), dan satu entri riwayat status dicatat.

**FR-REP-02 Daftar laporan.** Kolom: nomor, judul, kategori, prioritas, status, lokasi, pelapor (untuk Petugas dan Admin), penanggung jawab, tanggal dibuat. Filter: kategori, status, prioritas, penanggung jawab. Pencarian pada judul dan nomor. Urutan default: terbaru. Pagination 20 baris. Karyawan hanya melihat laporan miliknya.

**FR-REP-03 Detail laporan.** Menampilkan seluruh field, galeri foto Sebelum dan Sesudah berdampingan, penanggung jawab, catatan penyelesaian atau alasan penolakan, linimasa riwayat status, dan bagian komentar. Foto dapat dibuka dalam tampilan besar.

**FR-REP-04 Ubah laporan.** Karyawan dapat mengubah judul, deskripsi, lokasi, prioritas, dan foto awal hanya selama status masih Baru. Admin dapat mengubah kapan saja.

**FR-REP-05 Ambil laporan.** Petugas atau Admin dapat menekan tombol Ambil Laporan pada laporan berstatus Baru tanpa penanggung jawab. Penanggung jawab terisi, dan status menjadi Diproses.

**FR-REP-06 Tetapkan penanggung jawab (Admin).** Admin dapat memilih petugas aktif sebagai penanggung jawab.

**FR-REP-07 Komentar (S).** Komentar teks 1 sampai 1000 karakter, urut kronologis, menampilkan nama, peran, dan waktu. Komentar tidak dapat diubah atau dihapus pada MVP.

### 6.4 Lampiran Foto (M)

**FR-ATT-01 Jenis lampiran.** BEFORE untuk bukti awal oleh pelapor, AFTER untuk bukti penyelesaian oleh petugas atau admin.

**FR-ATT-02 Validasi.** Tipe yang diizinkan: JPEG, PNG, WebP. Ukuran maksimal 5 MB per file setelah kompresi. Maksimal 5 foto BEFORE dan 5 foto AFTER per laporan.

**FR-ATT-03 Kompresi di sisi browser.** Sebelum diunggah, gambar diperkecil ke sisi terpanjang maksimal 1600 piksel dan dikonversi ke JPEG atau WebP dengan kualitas sekitar 0,8. Ini menghemat kuota storage gratis dan mempercepat unggah. Pada perangkat mobile, input file boleh langsung membuka kamera belakang.

**FR-ATT-04 Pratinjau dan hapus sebelum kirim.** Pengguna melihat miniatur foto yang dipilih, dapat menghapus satu foto, dan melihat progres unggah per foto.

**FR-ATT-05 Akses foto privat.** Bucket tidak publik. Foto ditampilkan lewat URL bertanda tangan berumur pendek yang dibuat server setelah otorisasi lolos (lihat bagian 11).

### 6.5 Papan Kanban (M, Petugas dan Admin)

**FR-KAN-01 Kolom.** Tiga kolom: Baru, Diproses, Selesai. Laporan berstatus Ditolak tidak tampil di papan dan dapat dilihat lewat daftar laporan dengan filter status.

**FR-KAN-02 Kartu.** Setiap kartu menampilkan nomor, judul, ikon kategori, lencana prioritas, lokasi, inisial penanggung jawab, dan jumlah foto. Mengklik kartu membuka detail laporan.

**FR-KAN-03 Pindah status.** Drag and drop antar kolom memakai pustaka dnd-kit.
- Wajib tersedia alternatif non-drag berupa menu Pindahkan ke pada setiap kartu, agar dapat dipakai di layar sentuh dan dengan keyboard.
- Pemindahan divalidasi di server memakai aturan bagian 7. Jika ditolak, kartu kembali ke posisi semula dengan pesan galat yang jelas (pembaruan optimistis dengan rollback).
- Memindahkan ke Selesai membuka dialog yang mewajibkan catatan penyelesaian dan minimal satu foto AFTER.
- Menolak laporan (aksi pada kartu atau detail) mewajibkan alasan penolakan.

**FR-KAN-04 Urutan dalam kolom.** Otomatis: prioritas tertinggi lebih dulu, lalu yang terlama lebih dulu. Tidak ada pengurutan manual.

**FR-KAN-05 Filter papan.** Filter kategori, penanggung jawab (termasuk pilihan Saya), prioritas, dan pencarian. Kolom Selesai hanya menampilkan 30 hari terakhir.

### 6.6 Dashboard Admin (S)

Kartu ringkasan: jumlah laporan per status, jumlah per kategori, rata-rata waktu penyelesaian (dari dibuat sampai selesai), jumlah laporan Baru yang berumur lebih dari 2 hari, dan 10 laporan terbaru. Grafik sederhana berbasis CSS atau SVG tanpa pustaka berat.

### 6.7 Profil (M)

Pengguna dapat melihat data dirinya, mengubah nama dan nomor telepon, serta mengganti password (memerlukan password lama).

## 7. Alur Status dan Aturan Transisi

Status: NEW (Baru), IN_PROGRESS (Diproses), DONE (Selesai), REJECTED (Ditolak).

| Dari | Ke | Siapa | Syarat |
|---|---|---|---|
| NEW | IN_PROGRESS | Petugas, Admin | Jika belum ada penanggung jawab, pelaku otomatis menjadi penanggung jawab |
| NEW | REJECTED | Petugas, Admin | Alasan penolakan wajib |
| IN_PROGRESS | DONE | Penanggung jawab, Admin | Catatan penyelesaian wajib dan minimal 1 foto AFTER |
| IN_PROGRESS | NEW | Penanggung jawab, Admin | Penanggung jawab dikosongkan |
| IN_PROGRESS | REJECTED | Penanggung jawab, Admin | Alasan penolakan wajib |
| DONE | IN_PROGRESS | Admin | Membuka kembali laporan, catatan wajib |
| REJECTED | NEW | Admin | Mengaktifkan kembali laporan |

Aturan umum:
- Setiap perubahan status membuat satu baris ReportStatusLog (status asal, status tujuan, pelaku, catatan, waktu) dalam transaksi database yang sama dengan perubahan status.
- startedAt diisi saat pertama kali masuk IN_PROGRESS. completedAt diisi saat masuk DONE dan dikosongkan saat dibuka kembali.
- Transisi di luar tabel ditolak server dengan kode galat yang jelas, apa pun yang dikirim klien.
- Logika transisi berada di satu modul murni (status-machine) agar mudah diuji.

## 8. Model Data

### 8.1 Diagram Relasi

```mermaid
erDiagram
  Department ||--o{ User : "memiliki"
  User ||--o{ Report : "melaporkan (reporter)"
  User ||--o{ Report : "menangani (assignee)"
  Report ||--o{ Attachment : "memiliki"
  User ||--o{ Attachment : "mengunggah"
  Report ||--o{ ReportStatusLog : "memiliki riwayat"
  User ||--o{ ReportStatusLog : "pelaku"
  Report ||--o{ Comment : "memiliki"
  User ||--o{ Comment : "menulis"
```

### 8.2 Ringkasan Tabel Inti

| Tabel | Fungsi | Relasi penting |
|---|---|---|
| User | Akun, peran, status aktif | Milik satu Department (opsional). Satu User dapat menjadi reporter atau assignee banyak Report |
| Department | Pengelompokan karyawan | Satu Department memiliki banyak User |
| Report | Laporan GA | Satu reporter wajib, satu assignee opsional, banyak Attachment, StatusLog, Comment |
| Attachment | Metadata foto di object storage | Milik satu Report dan satu uploader |
| ReportStatusLog | Riwayat perubahan status | Milik satu Report dan satu pelaku |
| Comment | Percakapan pada laporan | Milik satu Report dan satu penulis |

Tabel autentikasi bawaan Auth.js (Account, Session, VerificationToken) tidak dibuat karena memakai Credentials dengan sesi JWT dan tanpa adapter database.

### 8.3 Skema Prisma

Catatan: sesuaikan blok generator dan datasource dengan versi Prisma yang dipakai. Prisma 7 memindahkan konfigurasi URL ke prisma.config.ts (lihat bagian 12.4).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  ADMIN
  OFFICER
  EMPLOYEE
}

enum ReportCategory {
  BUILDING
  CATERING
  FACILITY
}

enum ReportPriority {
  LOW
  MEDIUM
  HIGH
}

enum ReportStatus {
  NEW
  IN_PROGRESS
  DONE
  REJECTED
}

enum AttachmentKind {
  BEFORE
  AFTER
}

model Department {
  id    String @id @default(cuid())
  name  String @unique
  users User[]

  @@map("departments")
}

model User {
  id                 String   @id @default(cuid())
  employeeNo         String?  @unique
  name               String
  email              String   @unique
  passwordHash       String
  role               Role     @default(EMPLOYEE)
  isActive           Boolean  @default(true)
  mustChangePassword Boolean  @default(true)
  phone              String?
  departmentId       String?
  department         Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  reportsCreated  Report[]          @relation("ReportReporter")
  reportsAssigned Report[]          @relation("ReportAssignee")
  attachments     Attachment[]
  statusLogs      ReportStatusLog[]
  comments        Comment[]

  @@index([role, isActive])
  @@map("users")
}

model Report {
  id              String         @id @default(cuid())
  number          Int            @unique @default(autoincrement())
  title           String
  description     String
  category        ReportCategory
  priority        ReportPriority @default(MEDIUM)
  status          ReportStatus   @default(NEW)
  locationDetail  String
  resolutionNote  String?
  rejectionReason String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  reporterId String
  reporter   User    @relation("ReportReporter", fields: [reporterId], references: [id], onDelete: Restrict)
  assigneeId String?
  assignee   User?   @relation("ReportAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)

  attachments Attachment[]
  statusLogs  ReportStatusLog[]
  comments    Comment[]

  @@index([status, category])
  @@index([reporterId, createdAt])
  @@index([assigneeId, status])
  @@map("reports")
}

model Attachment {
  id           String         @id @default(cuid())
  kind         AttachmentKind
  objectKey    String         @unique
  fileName     String
  mimeType     String
  sizeBytes    Int
  createdAt    DateTime       @default(now())

  reportId     String
  report       Report @relation(fields: [reportId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User   @relation(fields: [uploadedById], references: [id], onDelete: Restrict)

  @@index([reportId, kind])
  @@map("attachments")
}

model ReportStatusLog {
  id         String        @id @default(cuid())
  fromStatus ReportStatus?
  toStatus   ReportStatus
  note       String?
  createdAt  DateTime      @default(now())

  reportId   String
  report     Report @relation(fields: [reportId], references: [id], onDelete: Cascade)
  actorId    String
  actor      User   @relation(fields: [actorId], references: [id], onDelete: Restrict)

  @@index([reportId, createdAt])
  @@map("report_status_logs")
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  createdAt DateTime @default(now())

  reportId  String
  report    Report @relation(fields: [reportId], references: [id], onDelete: Cascade)
  authorId  String
  author    User   @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([reportId, createdAt])
  @@map("comments")
}
```

Aturan data:
- Waktu disimpan dalam UTC dan ditampilkan dalam zona Asia/Jakarta (WIB) dengan lokal id-ID.
- Nomor laporan ditampilkan sebagai GA ditambah nomor urut 5 digit (contoh GA-00042).
- Penghapusan permanen pengguna tidak dilakukan, hanya penonaktifan.

## 9. Arsitektur dan Tech Stack

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Framework | Next.js (App Router), TypeScript mode strict | Gunakan versi stabil terbaru saat inisialisasi proyek |
| Autentikasi | NextAuth (Auth.js v5), Credentials provider, sesi JWT | Cek tag versi yang benar saat instalasi (lihat bagian 18) |
| ORM | Prisma | PostgreSQL |
| Database dev | PostgreSQL di Docker | Samakan major version dengan proyek Supabase |
| Database prod | Supabase (hanya sebagai Postgres) | Tidak memakai Supabase Auth maupun Supabase Storage |
| Object storage dev | S3-compatible lokal di Docker (MinIO atau pengganti, lihat 12.2) | Diakses lewat AWS SDK v3 |
| Object storage prod | Backblaze B2 lewat S3-compatible API | Bucket privat |
| Hosting | Vercel (Hobby untuk demo) | Hobby hanya untuk penggunaan non-komersial |
| UI | Tailwind CSS, Radix primitives atau shadcn/ui, lucide-react | Mengikuti token bagian 13 |
| Form dan validasi | react-hook-form dan zod | Skema zod dipakai di klien dan server |
| Kanban | dnd-kit | Dengan alternatif menu untuk non-drag |
| Kompresi gambar | Canvas API atau browser-image-compression | Dijalankan di klien |
| Hash password | bcryptjs | Pure JavaScript, aman untuk serverless |

### 9.1 Prinsip Arsitektur

1. **Otorisasi di lapisan aplikasi.** Karena akses database melalui Prisma dengan peran database pemilik, Row Level Security Postgres tidak dipakai untuk otorisasi aplikasi. Seluruh aturan hak akses berada di modul permissions dan service layer.
2. **Logika bisnis tidak di komponen.** Komponen UI memanggil server action. Server action memanggil service. Service memakai Prisma.
3. **Satu sumber aturan.** Matriks hak akses dan mesin status masing-masing berada di satu modul dan diuji.
4. **Validasi dua sisi.** Zod di klien untuk pengalaman pengguna dan di server untuk keamanan.
5. **Mutasi lewat Server Actions**, kecuali pembuatan URL unggah yang memakai Route Handler.

### 9.2 Struktur Folder

```
.
  docker-compose.yml
  .env.example
  prisma/
    schema.prisma
    seed.ts
    migrations/
  scripts/
    init-storage.ts          membuat bucket di S3 lokal bila belum ada
    check-ui-text.ts         memeriksa tidak ada emoji atau simbol di teks UI
  src/
    auth.ts                  konfigurasi NextAuth
    proxy.ts                 (atau middleware.ts sesuai versi Next.js) pengalihan kasar
    app/
      (auth)/login/page.tsx
      (auth)/change-password/page.tsx
      (app)/layout.tsx       shell aplikasi dengan navigasi sesuai peran
      (app)/dashboard/page.tsx
      (app)/reports/page.tsx
      (app)/reports/new/page.tsx
      (app)/reports/[id]/page.tsx
      (app)/board/page.tsx
      (app)/admin/users/page.tsx
      (app)/profile/page.tsx
      api/auth/[...nextauth]/route.ts
      api/uploads/presign/route.ts
    components/
      ui/                    komponen dasar
      reports/ board/ users/ upload/
    lib/
      db.ts                  instance Prisma tunggal
      s3.ts                  klien S3 dan fungsi presign
      permissions.ts         matriks hak akses
      status-machine.ts      aturan transisi status
      validators/            skema zod
      format.ts              format tanggal dan nomor laporan
    server/
      reports.ts users.ts attachments.ts comments.ts dashboard.ts
```

## 10. Rute Halaman

| Rute | Peran | Deskripsi |
|---|---|---|
| /login | Publik | Masuk |
| /change-password | Semua (login) | Ganti password wajib atau sukarela |
| /dashboard | Admin | Ringkasan |
| /board | Petugas, Admin | Papan kanban |
| /reports | Semua | Daftar laporan (otomatis dibatasi sesuai peran) |
| /reports/new | Semua | Buat laporan |
| /reports/[id] | Sesuai hak akses | Detail laporan |
| /admin/users | Admin | Manajemen pengguna |
| /profile | Semua | Profil |

Navigasi sesuai peran:
- Karyawan: Laporan Saya, Buat Laporan, Profil.
- Petugas: Papan Kanban, Semua Laporan, Buat Laporan, Profil.
- Admin: Dashboard, Papan Kanban, Semua Laporan, Pengguna, Profil.

## 11. Penyimpanan File (Object Storage)

### 11.1 Alur Unggah

1. Klien memilih foto, mengompresnya, lalu memanggil `POST /api/uploads/presign` dengan nama file, tipe, dan ukuran.
2. Server memeriksa sesi, tipe, ukuran, dan jumlah, lalu membuat object key `uploads/{userId}/{yyyy}/{mm}/{uuid}.{ext}` dan URL PUT bertanda tangan berumur 5 menit.
3. Klien mengunggah langsung ke object storage memakai HTTP PUT dengan header Content-Type yang sama.
4. Saat form laporan dikirim, klien menyertakan daftar object key. Server memverifikasi bahwa setiap key berawalan `uploads/{userId}/`, memeriksa keberadaan dan ukuran objek (HeadObject), lalu membuat baris Attachment dalam transaksi yang sama dengan pembuatan laporan.
5. Saat menampilkan laporan, server membuat URL GET bertanda tangan berumur 10 menit untuk tiap foto setelah otorisasi lolos. Tag img biasa dipakai (bukan optimasi next/image) karena URL berubah-ubah.

### 11.2 Konfigurasi Klien S3

- Gunakan AWS SDK v3 (client-s3 dan s3-request-presigner).
- Aktifkan forcePathStyle.
- Endpoint, region, bucket, dan kredensial berasal dari environment variable sehingga kode yang sama berjalan di dev dan prod.
- Backblaze B2 menolak permintaan yang menyertakan header checksum tambahan (x-amz-checksum-*). Pada AWS SDK v3 versi baru yang menambahkan checksum secara default, atur kalkulasi checksum menjadi hanya saat diwajibkan (opsi requestChecksumCalculation dan responseChecksumValidation bernilai WHEN_REQUIRED). Sesuaikan nama opsi dengan versi SDK yang dipakai.

### 11.3 CORS

Unggah langsung dari browser memerlukan CORS pada bucket.
- Backblaze B2: atur CORS rules pada bucket (izinkan origin domain Vercel dan localhost, metode PUT dan GET, header yang diperlukan).
- S3 lokal: CORS diatur lewat konfigurasi server (untuk MinIO memakai variabel MINIO_API_CORS_ALLOW_ORIGIN), karena MinIO tidak memakai API CORS per bucket seperti S3.

### 11.4 Perkiraan Kuota

Dengan foto terkompresi sekitar 300 sampai 600 KB, kuota gratis 10 GB Backblaze B2 muat puluhan ribu foto (perkiraan, bukan jaminan). Bucket tetap harus dipantau.

## 12. Lingkungan Dev dan Prod

### 12.1 Perbandingan

| Komponen | Development (lokal) | Production |
|---|---|---|
| Aplikasi | next dev di mesin lokal | Vercel |
| PostgreSQL | Docker image postgres | Supabase |
| Object storage | S3 lokal di Docker | Backblaze B2 |
| Variabel lingkungan | .env.local | Environment Variables di Vercel |
| Migrasi | prisma migrate dev | prisma migrate deploy dijalankan dari mesin lokal dengan DIRECT_URL |
| Seed | Otomatis lewat npm script | Dijalankan sekali manual, lalu ganti password akun admin |

### 12.2 Docker Compose (dev)

Catatan penting: image resmi MinIO komunitas sudah tidak dipublikasikan di Docker Hub dan repositori resminya diarsipkan pada April 2026. Pilihan yang harus diverifikasi ketersediaannya sebelum dipakai: image Chainguard untuk MinIO, fork komunitas (misalnya pgsty/minio), atau alternatif S3-compatible lain seperti RustFS. Aplikasi tidak boleh bergantung pada fitur khusus MinIO, hanya API S3 standar, sehingga penggantian cukup lewat variabel S3_IMAGE dan environment variable.

```yaml
services:
  db:
    image: postgres:17-alpine          # samakan major version dengan Supabase
    environment:
      POSTGRES_USER: lapor
      POSTGRES_PASSWORD: lapor
      POSTGRES_DB: lapor_ga
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lapor -d lapor_ga"]
      interval: 5s
      timeout: 3s
      retries: 10

  s3:
    image: ${S3_IMAGE:-cgr.dev/chainguard/minio:latest}   # verifikasi ketersediaan image
    command: ["server", "/data", "--console-address", ":9001"]
    environment:
      MINIO_ROOT_USER: localaccess
      MINIO_ROOT_PASSWORD: localsecret123
      MINIO_API_CORS_ALLOW_ORIGIN: "http://localhost:3000"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - s3data:/data

volumes:
  pgdata:
  s3data:
```

Bucket dibuat oleh `scripts/init-storage.ts` (idempotent) memakai AWS SDK, bukan CLI khusus MinIO, agar tidak bergantung pada image tertentu. Skrip ini hanya membuat bucket dan tidak mengatur CORS.

### 12.3 Environment Variables (.env.example)

```
# Database
DATABASE_URL="postgresql://lapor:lapor@localhost:5432/lapor_ga"
DIRECT_URL="postgresql://lapor:lapor@localhost:5432/lapor_ga"

# Auth
AUTH_SECRET="isi-dengan-string-acak-panjang"
AUTH_URL="http://localhost:3000"

# Object storage (dev: S3 lokal, prod: Backblaze B2)
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_BUCKET="lapor-ga"
S3_ACCESS_KEY_ID="localaccess"
S3_SECRET_ACCESS_KEY="localsecret123"
S3_FORCE_PATH_STYLE="true"

# Batas aplikasi
UPLOAD_MAX_BYTES="5242880"
MAX_ATTACHMENTS_PER_KIND="5"
UPLOAD_URL_TTL_SECONDS="300"
DOWNLOAD_URL_TTL_SECONDS="600"
```

Nilai produksi:
- S3_ENDPOINT berisi endpoint S3 dari halaman detail bucket Backblaze B2 (format s3.nama-region.backblazeb2.com dengan https), S3_REGION berisi nama region yang sama dengan bagian endpoint.
- S3_ACCESS_KEY_ID dan S3_SECRET_ACCESS_KEY berasal dari application key B2 yang dibatasi hanya untuk bucket ini.
- DATABASE_URL berasal dari connection pooler Supabase (mode transaction, port 6543) dengan parameter pgbouncer=true. DIRECT_URL berasal dari koneksi langsung (port 5432). Jika koneksi langsung gagal dari jaringan lokal karena hanya mendukung IPv6, gunakan session pooler pada port 5432.
- Rahasia tidak pernah dimasukkan ke repositori. Hanya .env.example yang di-commit.

### 12.4 Catatan Prisma dengan Supabase

- Query aplikasi memakai URL pooler. Migrasi memakai URL langsung, karena migrate tidak bekerja melalui pooler mode transaction.
- Prisma 7 memakai berkas prisma.config.ts untuk URL datasource dan mensyaratkan konfigurasi tambahan. Ikuti dokumentasi versi yang terpasang.
- Prisma hanya mengelola skema public. Jangan mengubah skema internal Supabase (auth, storage, realtime).
- Pengerasan produksi: aktifkan Row Level Security pada seluruh tabel aplikasi di Supabase tanpa membuat policy apa pun. Ini menutup akses melalui Data API Supabase, sedangkan Prisma tetap berjalan karena menggunakan peran database pemilik. Verifikasi dengan uji bahwa kunci anon Supabase tidak bisa membaca tabel.

### 12.5 Deployment Vercel

- Hubungkan repositori GitHub, isi seluruh environment variable pada pengaturan proyek.
- Tambahkan skrip postinstall untuk prisma generate agar klien Prisma tersedia saat build.
- Pilih region fungsi yang terdekat dengan region proyek Supabase (disarankan Singapura untuk pengguna Indonesia), sejauh paket yang dipakai mengizinkan.
- Hobby: hanya non-komersial dan memiliki batas penggunaan (lihat bagian 16). Perusahaan yang ingin memakai aplikasi ini sungguhan harus memakai paket berbayar atau hosting lain.

### 12.6 Seed Data

Seed menghasilkan: 4 departemen, 1 admin, 2 petugas, 4 karyawan (password demo diganti saat login pertama), dan 10 laporan contoh dalam berbagai status dan kategori. Seed foto contoh bersifat opsional. Semua data adalah data fiktif tanpa foto orang atau lokasi nyata.

## 13. Desain UI dan UX

### 13.1 Prinsip

Minimalis dan elegan. Banyak ruang kosong, hierarki jelas, warna tenang, informasi padat tapi mudah dipindai. Hanya mode terang.

### 13.2 Aturan Wajib

1. **Tanpa emoji dan tanpa simbol** di seluruh teks antarmuka, termasuk label tombol, placeholder, pesan toast, pesan galat, tooltip, dan keadaan kosong. Ini berarti tidak ada karakter dekoratif seperti panah, bullet, tanda centang atau silang berbentuk teks, bintang, tanda hak cipta, atau panah ASCII. Tanda baca standar (titik, koma, titik dua, tanda hubung, garis miring pada format tanggal) tetap boleh.
2. **Ikon seperlunya dan tepat**, memakai satu pustaka (lucide-react), ukuran konsisten (16 atau 20 piksel), tebal garis 1,5. Ikon selalu menyertai arti yang jelas (disertai label atau aria-label). Jangan memakai ikon sebagai dekorasi.
3. **Font Poppins** untuk seluruh teks, dimuat lewat next/font dengan bobot 400, 500, dan 600.
4. **Mode terang saja.** Atur color-scheme ke light dan jangan membuat varian gelap.
5. **Penanda status tidak boleh hanya warna.** Lencana status selalu memuat teks.
6. Inisial nama pada lingkaran dipakai sebagai avatar (bukan gambar atau emoji).
7. Skrip `scripts/check-ui-text.ts` memindai berkas di src untuk emoji (Extended_Pictographic) dan karakter simbol dekoratif pada string UI. Skrip ini dijalankan sebagai bagian dari pemeriksaan sebelum commit dan menjadi syarat Definition of Done.

### 13.3 Daftar Ikon yang Diizinkan

| Kebutuhan | Ikon lucide-react |
|---|---|
| Kategori Gedung | Building2 |
| Kategori Catering | UtensilsCrossed |
| Kategori Sarpras | Wrench |
| Unggah atau tambah foto | ImagePlus, Camera |
| Tambah | Plus |
| Cari | Search |
| Filter | SlidersHorizontal |
| Papan kanban | Columns3 |
| Dashboard | LayoutDashboard |
| Pengguna | Users |
| Profil | UserRound |
| Keluar | LogOut |
| Lihat atau sembunyikan password | Eye, EyeOff |
| Ubah dan hapus | Pencil, Trash2 |
| Tutup | X |
| Komentar | MessageSquare |
| Foto | Image |
| Lokasi | MapPin |
| Waktu | Clock |

Ikon di luar daftar ini perlu alasan yang jelas dan tetap tidak boleh berbentuk emoji.

### 13.4 Token Desain

| Token | Nilai | Pemakaian |
|---|---|---|
| bg | #FFFFFF | Latar halaman |
| surface | #FAFAF9 | Kartu, panel, kolom kanban |
| border | #E7E5E4 | Garis pembatas |
| text | #1C1917 | Teks utama |
| text-muted | #57534E | Teks sekunder |
| primary | #1E293B | Tombol utama, tautan aktif |
| primary-hover | #0F172A | Hover tombol utama |
| accent | #9A7B4F | Penanda navigasi aktif dan sorotan halus (bukan untuk teks kecil) |
| focus-ring | #1E293B dengan offset 2 piksel | Fokus keyboard |

Warna status (latar dan teks):

| Status atau prioritas | Latar | Teks |
|---|---|---|
| Baru, Rendah | #F1F5F9 | #334155 |
| Diproses | #FEF3C7 | #92400E |
| Selesai | #DCFCE7 | #166534 |
| Ditolak | #FEE2E2 | #991B1B |
| Sedang | #E0E7FF | #3730A3 |
| Tinggi | #FFEDD5 | #9A3412 |

Tipografi (Poppins): teks isi 14 piksel, teks kecil 12, subjudul 16, judul halaman 24 dengan bobot 600, tinggi baris 1,5 untuk isi. Sudut membulat 8 piksel untuk kontrol dan 12 untuk kartu. Bayangan sangat halus (satu lapis, opasitas rendah) atau tanpa bayangan dengan garis tepi. Skala jarak kelipatan 4 piksel.

### 13.5 Pola Halaman

- **Shell:** bilah samping di desktop (lebar sekitar 240 piksel), berubah menjadi bilah atas dengan menu geser pada layar kecil. Penanda navigasi aktif memakai garis aksen di sisi, bukan warna latar mencolok.
- **Login:** satu kartu di tengah, logo teks, dua input, satu tombol. Tidak ada ilustrasi.
- **Daftar laporan:** tabel pada desktop dan daftar kartu pada mobile. Filter berada di atas tabel dalam satu baris.
- **Buat laporan:** form satu kolom, area unggah foto berupa kotak putus-putus dengan ikon ImagePlus, miniatur foto beserta tombol hapus.
- **Detail laporan:** dua kolom pada desktop. Kiri: informasi dan galeri Sebelum dan Sesudah. Kanan: linimasa status dan komentar.
- **Kanban:** tiga kolom dengan lebar sama, kolom berlatar surface, kartu berlatar putih dengan garis tepi. Pada mobile, kolom bergulir horizontal atau ditampilkan per tab.
- **Manajemen pengguna:** tabel dengan aksi per baris di menu titik tiga yang memakai ikon, serta dialog untuk tambah dan ubah.

### 13.6 Keadaan Antarmuka

Setiap halaman mendefinisikan: keadaan memuat (skeleton sederhana), keadaan kosong (satu kalimat dan satu tombol tindakan, tanpa ilustrasi), dan keadaan galat (pesan jelas dengan tombol coba lagi). Aksi yang berhasil memberi pemberitahuan singkat berupa teks tanpa simbol.

### 13.7 Daftar Teks UI Utama (contoh gaya bahasa)

Nada netral dan sopan, kalimat singkat. Contoh: Buat Laporan, Kirim Laporan, Ambil Laporan, Tandai Selesai, Tolak Laporan, Laporan berhasil dikirim, Foto wajib diunggah minimal satu, Anda tidak memiliki akses ke halaman ini. Seluruh teks dikumpulkan di satu berkas konstanta agar mudah diperiksa oleh skrip pemeriksa teks UI.

## 14. Keamanan dan Privasi

| Risiko | Kontrol |
|---|---|
| Karyawan membuka laporan atau foto orang lain | Otorisasi di service layer pada setiap query, URL foto dibuat server setelah otorisasi, bucket privat. Diuji otomatis |
| Peningkatan hak akses lewat manipulasi klien | Peran dan status aktif dibaca ulang dari database pada tiap aksi server |
| Unggah file berbahaya | Validasi tipe dan ukuran di presign dan saat HeadObject, hanya image JPEG, PNG, WebP, nama object key dibuat server (nama asli hanya disimpan sebagai metadata) |
| Penimpaan atau pencurian object key milik pengguna lain | Key wajib berawalan uploads dan id pengguna, diverifikasi di server |
| Brute force login | Pembatasan percobaan (FR-AUTH-05), pesan galat generik |
| Kebocoran password | Hash bcrypt, password sementara ditampilkan satu kali, tidak dicatat di log |
| Kebocoran rahasia | Seluruh rahasia di environment variable, .env tidak di-commit |
| Akses data langsung lewat Data API Supabase | Aktifkan RLS tanpa policy pada semua tabel aplikasi (bagian 12.4) |
| Data pribadi pada foto | Peringatan singkat pada form unggah agar tidak memotret wajah atau dokumen pribadi yang tidak perlu. Demo hanya memakai data fiktif |
| Serangan CSRF dan XSS | Mengandalkan proteksi bawaan Auth.js dan Next.js, seluruh keluaran teks pengguna di-escape (tanpa dangerouslySetInnerHTML) |

## 15. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
|---|---|
| Responsif | Berfungsi baik mulai lebar 360 piksel |
| Peramban | Versi terbaru Chrome, Safari, Firefox, dan Edge |
| Aksesibilitas | Kontras teks memenuhi WCAG AA, seluruh aksi dapat dilakukan dengan keyboard, label form dan aria-label tersedia |
| Performa | Halaman daftar dan detail terasa responsif pada koneksi seluler. Foto dimuat lazy. Unggah memakai gambar yang sudah dikompres |
| Ketahanan | Kegagalan unggah satu foto tidak menggagalkan foto lain, dan pengguna dapat mengulang |
| Kualitas kode | TypeScript strict, ESLint, Prettier, tanpa penggunaan any tanpa alasan |
| Observabilitas | Log galat server yang tidak memuat data sensitif |

## 16. Batasan Paket Gratis yang Memengaruhi Desain

Angka berikut dicek pada 25 Oktober 2026 dan dapat berubah. Verifikasi ulang sebelum merekam video.

| Layanan | Batas yang relevan | Dampak ke produk |
|---|---|---|
| Vercel Hobby | Non-komersial. Sekitar 100 GB bandwidth, 1 juta edge request, 4 jam CPU, 100 menit build per bulan. Proyek dijeda bila melebihi kuota. Deployment lama yang tidak diproteksi dapat dihapus bila total melebihi 10 GB | Cocok untuk demo. Tidak boleh dipakai untuk produk komersial |
| Supabase Free | 2 proyek aktif, database 500 MB per proyek, proyek dijeda setelah sekitar seminggu tanpa aktivitas dan perlu diaktifkan manual | Pastikan proyek aktif sebelum rekaman dan demo |
| Backblaze B2 | 10 GB pertama gratis, egress gratis sampai 3 kali volume simpanan | Kompresi foto di klien. Sumber berbeda pendapat apakah pendaftaran perlu kartu kredit, uji sendiri |

## 17. Rencana Pengerjaan untuk AI Coding Assistant

Kerjakan berurutan. Setiap tahap selesai bila kriteria selesai terpenuhi dan dapat dijalankan sebelum lanjut ke tahap berikutnya.

| Tahap | Cakupan | Kriteria selesai |
|---|---|---|
| M0 Fondasi | Inisialisasi Next.js TypeScript, Tailwind, font Poppins, token desain, docker-compose, .env.example, koneksi Prisma, skrip init-storage | docker compose up menjalankan Postgres dan S3 lokal, halaman awal tampil dengan font dan warna sesuai token |
| M1 Skema dan seed | Skema Prisma bagian 8.3, migrasi awal, seed | prisma migrate dev dan seed berhasil, data contoh terlihat di database |
| M2 Autentikasi | NextAuth Credentials, JWT dengan peran, halaman login, ganti password wajib, proteksi rute dua lapis, shell dengan navigasi per peran | Tiga peran dapat login dan melihat menu yang benar, rute terlarang ditolak, akun nonaktif tidak bisa masuk |
| M3 Pengguna | Halaman admin pengguna sesuai FR-USER | Admin dapat tambah, ubah, reset password, nonaktifkan. Aturan admin terakhir dan diri sendiri berlaku |
| M4 Laporan dan foto | Alur presign, unggah dengan kompresi, buat laporan, daftar, detail, ubah laporan | Karyawan membuat laporan dengan foto, foto tampil lewat URL bertanda tangan, karyawan tidak bisa membuka laporan orang lain |
| M5 Status dan kanban | Mesin status, ambil laporan, kanban dengan dnd-kit dan menu pindah, dialog selesai dan tolak, riwayat status | Seluruh tabel transisi bagian 7 berjalan, Selesai tanpa foto AFTER ditolak |
| M6 Komentar dan dashboard | Komentar, dashboard admin | Komentar tampil berurutan, angka dashboard cocok dengan data |
| M7 Pengerasan | Skrip check-ui-text, pembatasan login (S), RLS tanpa policy pada Supabase, uji otomatis | Pemeriksa teks UI lulus, uji otorisasi dan mesin status lulus |
| M8 Deploy | Supabase, Backblaze B2 beserta CORS, Vercel, migrasi produksi | Seluruh alur utama berjalan di URL produksi |

### 17.1 Aturan untuk AI Coding Assistant

- Ikuti struktur folder bagian 9.2 dan tidak menambah pustaka di luar bagian 9 tanpa alasan tertulis.
- Jangan menaruh logika hak akses atau transisi status di komponen UI.
- Setiap server action wajib memanggil pemeriksaan sesi dan peran, lalu validasi zod, sebelum menyentuh database.
- Setiap teks antarmuka berasal dari berkas konstanta dan wajib lolos skrip check-ui-text.
- Jangan menggunakan emoji atau karakter simbol dekoratif di kode, komentar yang tampil ke pengguna, maupun data seed yang tampil di UI.
- Jangan mengasumsikan versi pustaka. Periksa dokumentasi versi terpasang untuk Auth.js, Prisma, Next.js, dan AWS SDK.
- Tulis uji untuk status-machine, permissions, dan otorisasi akses laporan sebelum menganggap tahap M4 sampai M5 selesai.

### 17.2 Strategi Pengujian

- **Uji unit (Vitest):** status-machine (seluruh transisi sah dan tidak sah), permissions (matriks bagian 4.1), validator zod.
- **Uji integrasi:** service laporan terhadap Postgres Docker, termasuk pembatasan akses per peran.
- **Uji end-to-end (Playwright, S):** alur karyawan membuat laporan, petugas mengambil lalu menyelesaikan dengan foto, admin mengelola pengguna.
- **Uji manual sebelum rekaman:** unggah foto dari ponsel, tampilan 360 piksel, URL foto kedaluwarsa tidak bisa dibuka.

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Image MinIO komunitas tidak lagi tersedia di Docker Hub | Docker compose gagal saat pull | Gunakan variabel S3_IMAGE, verifikasi image pengganti sebelum rekaman, kode hanya memakai API S3 standar |
| Backblaze B2 menolak checksum atau CORS salah | Unggah dari browser gagal | Atur opsi checksum SDK, atur CORS bucket, uji unggah dari origin produksi lebih awal |
| Backblaze B2 tidak memiliki region di Asia (perlu diverifikasi saat membuat bucket) | Unggah dari Indonesia lebih lambat | Kompresi gambar di klien, tampilkan progres unggah |
| Supabase dijeda karena tidak aktif | Demo gagal | Aktifkan proyek dan uji beberapa jam sebelum rekaman |
| Koneksi langsung Supabase hanya IPv6 | Migrasi dari jaringan lokal gagal | Gunakan session pooler port 5432 untuk DIRECT_URL |
| Perubahan versi Auth.js, Prisma, atau Next.js | Contoh kode tidak cocok | Kunci versi di package.json setelah M0 dan catat di README |
| Cold start dan batas fungsi Vercel Hobby | Respons pertama lambat | Jelaskan di video, jaga operasi berat tetap di klien (kompresi) |
| Penggunaan komersial di Vercel Hobby | Melanggar ketentuan | Nyatakan dengan jelas di video bahwa demo bersifat non-komersial |
| Foto HEIC dari iPhone | Unggah atau pratinjau gagal | Konversi ke JPEG di klien dengan Canvas sebelum unggah |
| Brute force login | Akun diambil alih | FR-AUTH-05 dan password sementara wajib diganti |

## 19. Asumsi dan Catatan Verifikasi

Dicek pada 25 Oktober 2026 dari dokumentasi dan sumber publik. Hal yang bertanda perlu diverifikasi harus dicek ulang sebelum implementasi.

- Backblaze B2 S3 API mendukung presigned URL, tetapi menolak permintaan dengan header checksum x-amz-checksum-*. Unggah langsung dari browser memerlukan CORS pada bucket. Pengaturan forcePathStyle direkomendasikan oleh panduan integrasi.
- Prisma dengan Supabase: pooler (port 6543, parameter pgbouncer=true) untuk query dan koneksi langsung untuk migrasi. Prisma 7 memindahkan URL ke prisma.config.ts.
- Auth.js v5 (NextAuth) adalah rilis ulang yang dipakai panduan 2026. Beberapa panduan masih memasang lewat tag beta, jadi cek tag yang benar saat instalasi. Next.js 16 mengganti nama middleware menjadi proxy, sehingga pola dokumentasi Auth.js perlu disesuaikan.
- MinIO komunitas: image Docker dicabut dari Docker Hub dan repositori diarsipkan pada April 2026. Ketersediaan image Chainguard, fork komunitas, dan RustFS perlu diverifikasi sebelum dipilih.
- Perlu diverifikasi: pilihan region fungsi pada Vercel Hobby, daftar region Backblaze B2, dan apakah pendaftaran Backblaze B2 memerlukan kartu kredit.
- Nama aplikasi (Lapor GA), format nomor laporan, dan batas angka (5 foto, 5 MB, 1600 piksel) adalah keputusan awal yang boleh disesuaikan.

## 20. Glosarium

| Istilah | Arti |
|---|---|
| GA | General Affairs, bagian umum yang mengurus gedung, catering, dan sarana prasarana |
| Sarpras | Sarana dan prasarana |
| Presigned URL | URL sementara bertanda tangan yang mengizinkan unggah atau unduh satu objek tanpa membagikan kredensial |
| Object key | Nama unik objek (file) di dalam bucket |
| Pooler | Perantara koneksi database yang menggabungkan banyak koneksi aplikasi |
| RLS | Row Level Security, pembatasan akses baris pada level database |
| Kanban | Papan kolom status untuk melacak progres pekerjaan |
