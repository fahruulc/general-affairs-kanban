// System and Domain Constants
// Strictly follows PRD 13.2: No emojis, no decorative symbols.

export const APP_CONFIG = {
  appName: "Lapor GA",
  reportNumberPrefix: "GA-",
  reportNumberPadLength: 5,
  maxUploadBytes: 5 * 1024 * 1024, // 5 MB
  maxAttachmentsPerKind: 5,
  uploadUrlTtlSeconds: 300, // 5 minutes
  downloadUrlTtlSeconds: 600, // 10 minutes
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  defaultPageSize: 20,
} as const;

export const CATEGORY_LABELS = {
  BUILDING: "Gedung",
  CATERING: "Catering",
  FACILITY: "Sarpras",
} as const;

export const PRIORITY_LABELS = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
} as const;

export const STATUS_LABELS = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  DONE: "Selesai",
  REJECTED: "Ditolak",
} as const;

export const ROLE_LABELS = {
  ADMIN: "Admin",
  OFFICER: "Petugas",
  EMPLOYEE: "Karyawan",
} as const;

export const UI_TEXT = {
  // Common
  save: "Simpan",
  cancel: "Batal",
  delete: "Hapus",
  edit: "Ubah",
  search: "Cari",
  filter: "Filter",
  loading: "Memuat...",
  noData: "Tidak ada data yang ditemukan.",
  unauthorized: "Anda tidak memiliki akses ke halaman ini.",
  serverError: "Terjadi kesalahan pada sistem. Silakan coba lagi.",

  // Auth
  login: "Masuk",
  logout: "Keluar",
  invalidCredentials: "Email atau password yang Anda masukkan salah.",
  accountInactive: "Akun Anda tidak aktif. Silakan hubungi admin.",
  passwordChanged: "Password berhasil diperbarui. Silakan login kembali.",
  mustChangePasswordPrompt: "Demi keamanan, Anda wajib mengganti password sementara Anda.",

  // Reports
  createReport: "Buat Laporan",
  submitReport: "Kirim Laporan",
  reportCreated: "Laporan berhasil dikirim.",
  reportUpdated: "Laporan berhasil diperbarui.",
  claimReport: "Ambil Laporan",
  reportClaimed: "Laporan berhasil diambil.",
  markDone: "Tandai Selesai",
  reportCompleted: "Laporan berhasil diselesaikan.",
  rejectReport: "Tolak Laporan",
  reportRejected: "Laporan telah ditolak.",
  reopenReport: "Buka Kembali Laporan",
  reportReopened: "Laporan dibuka kembali untuk diproses.",
  rejectionReasonRequired: "Alasan penolakan wajib diisi.",
  resolutionNoteRequired: "Catatan penyelesaian wajib diisi.",
  afterPhotoRequired: "Foto bukti penyelesaian wajib diunggah minimal satu.",
  beforePhotoRequired: "Foto bukti awal wajib diunggah minimal satu.",

  // Users
  addUser: "Tambah Pengguna",
  userCreated: "Pengguna baru berhasil ditambahkan.",
  userUpdated: "Data pengguna berhasil diperbarui.",
  passwordResetSuccess: "Password sementara berhasil dibuat.",
  cannotDeactivateSelf: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
  cannotDemoteSelf: "Anda tidak dapat menurunkan peran akun Anda sendiri.",
  mustHaveActiveAdmin: "Sistem harus memiliki minimal satu Admin aktif.",

  // Comments
  sendComment: "Kirim Komentar",
  commentSent: "Komentar berhasil dikirim.",
} as const;
