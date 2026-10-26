# Panduan Deployment Lapor GA (General Affairs)

Dokumen ini berisi panduan langkah demi langkah untuk melakukan deployment aplikasi **Lapor GA** ke **Vercel** dengan basis data **Supabase (PostgreSQL)** dan object storage **Backblaze B2 (S3-Compatible)**.

---

## 1. Arsitektur Produksi

* **Web & API Framework:** Next.js 16 (App Router) di Vercel
* **Database:** PostgreSQL di Supabase (via Connection Pooling PgBouncer)
* **Object Storage:** Backblaze B2 S3 API (Bucket: `general-affairs`)
* **Autentikasi:** NextAuth v5 (Auth.js) dengan JWT Session dan bcrypt password hashing

---

## 2. Konfigurasi Layanan Eksternal

### A. Supabase (Database)
1. Buka dashboard proyek Supabase Anda: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **Project Settings** > **Database** > **Connection string**.
3. Pilih tab **URI**:
   * **Transaction Pooler (Port 6543):** Digunakan untuk `DATABASE_URL`.
     Contoh format:
     ```env
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connect_timeout=15
     ```
   * **Session Pooler (Port 5432):** Digunakan untuk `DIRECT_URL` (migrasi schema Prisma).
     Contoh format:
     ```env
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=15
     ```
   * *Catatan Penting:* Tambahkan parameter `&connect_timeout=15` untuk mencegah timeout koneksi antar-wilayah saat koneksi pool pertama kali dibuka.

4. Migrasi schema dan seed data ke Supabase (dijalankan dari terminal lokal):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

---

### B. Backblaze B2 (Object Storage)
1. Buka dashboard Backblaze: [https://secure.backblaze.com/b2_buckets.htm](https://secure.backblaze.com/b2_buckets.htm).
2. **Buat Bucket:**
   * Nama Bucket: `general-affairs`
   * Files in Bucket are: **Private**
3. **Buat Application Key:**
   * Masuk ke **Application Keys** > **Add a New Application Key**.
   * Beri nama key (contoh: `general-affairs-app`).
   * Pilih bucket: `general-affairs`.
   * Type of Access: **Read and Write**.
   * Catat:
     * `keyID` -> digunakan untuk `S3_ACCESS_KEY_ID`
     * `applicationKey` -> digunakan untuk `S3_SECRET_ACCESS_KEY`
     * `s3Endpoint` -> contoh: `https://s3.us-east-005.backblazeb2.com`
     * `s3Region` -> contoh: `us-east-005`
4. **Pengaturan CORS Bucket (Opsional tapi Direkomendasikan):**
   * Masuk ke menu **Bucket Settings** > **CORS Rules**.
   * Tambahkan rule agar frontend browser dapat mengunggah file langsung jika diinginkan:
     * Allowed Origins: `https://*.vercel.app`, `http://localhost:3000`
     * Allowed Operations: `b2_upload_file`, `s3_put`, `s3_get`, `s3_head`
     * Allowed Headers: `*`
   * *Catatan:* Aplikasi sudah dilengkapi fallback server-side upload (`/api/uploads`) sehingga proses upload tetap berjalan lancar meski CORS browser dibatasi.

---

## 3. Persiapan Repositori dan Git

Jalankan perintah berikut di terminal lokal untuk memastikan seluruh perubahan kode terdorong ke GitHub:

```bash
# 1. Periksa file yang telah diubah
git status

# 2. Tambahkan semua file yang telah diperbarui
git add .

# 3. Buat commit
git commit -m "feat: prepare production config for supabase and backblaze b2"

# 4. Push ke repository remote
git push origin main
```

---

## 4. Konfigurasi Deployment di Vercel

1. Masuk ke dashboard Vercel: [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Klik tombol **Add New...** > **Project**.
3. Pilih repositori GitHub `general-affairs` (atau nama repositori Anda).
4. Di bagian **Build and Output Settings**:
   * Framework Preset: **Next.js**
   * Build Command: `prisma generate && next build` (default dari package.json `npm run build`)
   * Output Directory: `.next`
5. Buka bagian **Environment Variables** dan tambahkan variabel berikut satu per satu:

| Variable Name | Contoh Nilai | Deskripsi |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.xxx:xxx@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connect_timeout=15` | Connection pool Supabase (Port 6543) |
| `DIRECT_URL` | `postgresql://postgres.xxx:xxx@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=15` | Direct session Supabase (Port 5432) |
| `AUTH_SECRET` | `e98a3b50c182470ab2e917d0c89a05b3829037c68832a4e211933069176cb69f` | Secret key untuk signing JWT NextAuth |
| `S3_ENDPOINT` | `https://s3.us-east-005.backblazeb2.com` | S3 Endpoint dari Backblaze B2 |
| `S3_REGION` | `us-east-005` | Region bucket Backblaze B2 |
| `S3_BUCKET` | `general-affairs` | Nama bucket Backblaze B2 |
| `S3_ACCESS_KEY_ID` | `005f28bb92baad60000000001` | Application Key ID Backblaze |
| `S3_SECRET_ACCESS_KEY` | `K005IlDqmg4dXKr6AYEZx3eYXV4ocD8` | Application Key Secret Backblaze |
| `S3_FORCE_PATH_STYLE` | `true` | Wajib `true` untuk kompatibilitas Backblaze S3 API |
| `UPLOAD_MAX_BYTES` | `5242880` | Batas maksimum per file (5 MB) |
| `MAX_ATTACHMENTS_PER_KIND` | `5` | Batas maksimum lampiran per kategori |
| `UPLOAD_URL_TTL_SECONDS` | `300` | Masa berlaku presigned URL upload (detik) |
| `DOWNLOAD_URL_TTL_SECONDS` | `600` | Masa berlaku presigned URL download (detik) |

> Catatan tentang `AUTH_URL`:
> Anda **tidak perlu** menambahkan variable `AUTH_URL` di Vercel karena `src/auth.ts` sudah menyertakan `trustHost: true`. Vercel secara otomatis mendeteksi URL domain melalui variabel bawaan `VERCEL_URL`.

6. Klik tombol **Deploy**.
7. Tunggu hingga proses build selesai. Setelah selesai, Vercel akan memberikan domain aktif (misal: `https://general-affairs-xxx.vercel.app`).

---

## 5. Akun Pengujian Standar (Hasil Seed)

Setelah deployment selesai, Anda dapat langsung melakukan login menggunakan kredensial bawaan:

* **Administrator:**
  * Email: `admin@laporga.com`
  * Password: `Password123!`
* **Petugas:**
  * Email: `petugas1@laporga.com`
  * Password: `Password123!`
* **Pegawai:**
  * Email: `pegawai1@laporga.com`
  * Password: `Password123!`

---

## 6. Verifikasi Pasca Deployment

Lakukan langkah pengujian berikut pada aplikasi yang telah berjalan di Vercel:
1. **Login:** Masuk menggunakan akun Administrator atau Petugas. Pastikan halaman beralih ke `/dashboard` atau `/board`.
2. **Dashboard & Board:** Pastikan statistik ringkasan dan kartu Kanban terisi data laporan dari Supabase.
3. **Buat Laporan Baru:**
   * Buka menu buat laporan (`/reports/new`).
   * Isi judul, deskripsi, kategori, prioritas, dan lokasi.
   * Unggah dokumen / foto bukti. Pastikan proses upload berjalan lancar dan file tersimpan ke bucket Backblaze B2.
4. **Detail Laporan:** Buka detail laporan yang baru dibuat, periksa apakah gambar lampiran dapat ditampilkan dan dibuka dengan benar.
5. **Pergantian Status:** Uji perubahan status laporan (misal: `SUBMITTED` -> `IN_PROGRESS` -> `RESOLVED`) baik melalui Kanban Board maupun halaman detail.

---

## 7. Pemecahan Masalah (Troubleshooting)

### Error `CredentialsSignin` saat Login
* **Penyebab:** Password tidak cocok dengan hash bcrypt di database.
* **Solusi:** Jalankan script update password atau pastikan password yang dimasukkan tepat `Password123!`.

### Error Prisma `P1001: Can't reach database server`
* **Penyebab:** Handshake network ke database Supabase mengalami latency tinggi atau timeout.
* **Solusi:** Pastikan parameter `&connect_timeout=15` ada di akhir `DATABASE_URL` dan `DIRECT_URL`.

### Upload File Gagal Tanpa Log di Server
* **Penyebab:** Browser memblokir HTTP PUT langsung karena aturan CORS di bucket Backblaze B2.
* **Solusi:** Aplikasi otomatis beralih ke endpoint server-side `/api/uploads`. Pastikan `S3_ACCESS_KEY_ID` dan `S3_SECRET_ACCESS_KEY` di Environment Variables Vercel memiliki izin Read dan Write ke bucket tersebut.
