# Falghe Production Tracker

Sistem tracking produksi berbasis web untuk Falghe — duplikat dari SBC Production Tracker dengan branding FALGHE (#FB5F02).

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Neon PostgreSQL
- **File Storage**: Cloudinary (foto proses produksi)
- **WhatsApp**: Fonnte API
- **Deploy**: Vercel + GitHub

---

## LANGKAH DEPLOY — IKUTI URUTAN INI

### STEP 1 — Buat Repo GitHub

```bash
cd falghe-production-tracker
git init
git add .
git commit -m "Initial commit: Falghe Production Tracker"
```

Buat repo baru di https://github.com/new (nama: `falghe-production-tracker`)

```bash
git remote add origin https://github.com/USERNAME/falghe-production-tracker.git
git branch -M main
git push -u origin main
```

---

### STEP 2 — Setup Neon Database

1. Buka https://neon.tech → Sign up / Login
2. Klik **"New Project"** → nama: `falghe-tracker`
3. Pilih region terdekat (Singapore)
4. Copy **Connection String** yang muncul, bentuknya:
   ```
   postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
   ```
5. Simpan — ini untuk `DATABASE_URL`

> **Tabel akan dibuat otomatis** saat API pertama kali dipanggil (auto-migration).

---

### STEP 3 — Setup Cloudinary

1. Buka https://cloudinary.com → Sign up / Login
2. Dashboard → lihat **Cloud Name**, **API Key**, **API Secret**
3. Simpan ketiganya

---

### STEP 4 — Setup Fonnte (WhatsApp)

1. Buka https://fonnte.com → Login
2. Devices → tambah nomor WhatsApp kamu
3. Copy **API Token**
4. Simpan sebagai `FONNTE_TOKEN`

---

### STEP 5 — Deploy ke Vercel

1. Buka https://vercel.com → Login dengan GitHub
2. Klik **"Add New Project"** → Import repo `falghe-production-tracker`
3. **Framework Preset**: Other (Vite)
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Klik **"Environment Variables"** → tambahkan semua:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | postgresql://... (dari Neon) |
| `CLOUDINARY_CLOUD_NAME` | your_cloud_name |
| `CLOUDINARY_API_KEY` | your_api_key |
| `CLOUDINARY_API_SECRET` | your_api_secret |
| `FONNTE_TOKEN` | your_token |
| `VITE_ADMIN_PASSWORD` | password_admin_kamu |

7. Klik **Deploy** → tunggu ~2 menit

---

### STEP 6 — Copy Logo FALGHE

Setelah clone/download project, letakkan file logo:
```
client/public/falghe-logo.png
```

Logo ini sudah ada di folder jika kamu download ZIP dari sini.

---

## Fitur

| Halaman | Akses | Fitur |
|---------|-------|-------|
| Tracking | Publik | Search order by kode, lihat timeline + foto proses |
| Update Proses | Password | Input update divisi + upload foto ke Cloudinary |
| Admin | Password | CRUD order, generate kode, copy tracking link |
| Invoice | Password | Generate invoice dari order, edit items, pajak |

## Password Default
Password admin: `Falghe2024` (ubah di env `VITE_ADMIN_PASSWORD`)

## Kode Order
Format kode order: `FLG-00001`, `FLG-00002`, dst.

## Divisi Produksi
Cutting → Sablon → Jahit → Finishing → QC → Packing → Delivery
