# 📍 Presensi Pro v1

**Aplikasi Presensi Pegawai Berbasis Lokasi (GPS) dan Selfie**
Presensi Pro v3 adalah sistem absensi modern yang dirancang menggunakan Google Apps Script sebagai Backend dan antarmuka HTML/Tailwind CSS yang responsif. Sistem ini memvalidasi kehadiran pegawai berdasarkan titik koordinat (radius kantor) dan menyertakan bukti foto *selfie* real-time.

## 📸 Screenshots

<div align="center">
  <img src="assets/Dashboard%20Pegawai.webp" width="45%" alt="Dashboard Pegawai">
  <img src="assets/Dashboard%20Admin.webp" width="45%" alt="Dashboard Admin">
  <img src="assets/Menu%20Setup%20Lokasi%20kantor%20dan%20Radius.webp" width="30%" alt="Setup Lokasi">
  <img src="assets/Menu%20kelola%20Pegawai.webp" width="30%" alt="Kelola Pegawai">
  <img src="assets/Menu%20Log%20Absensi.webp" width="30%" alt="Log Absensi">
</div>

---

## 🌟 Fitur Utama
- **🌍 Validasi Geolokasi (Geofencing)**: Menolak absen jika posisi pegawai berada di luar radius kantor yang telah ditentukan.
- **📸 Selfie Capture (Native)**: Menggunakan akses kamera native dari smartphone untuk bypass isu keamanan *iframe* pada browser modern.
- **🗺️ Peta Interaktif**: Ditenagai oleh **Leaflet.js** untuk menampilkan posisi *real-time* pegawai dan visualisasi area kantor (radius lingkaran).
- **👥 Manajemen Multi-Role**: Pemisahan hak akses antara **Admin** dan **Pegawai**.
- **⚙️ Pengaturan Dinamis**: Admin dapat menggeser pin lokasi kantor di peta dan mengubah radius toleransi langsung dari antarmuka web, tanpa perlu coding.
- **📊 Laporan Real-Time**: Data kehadiran tersinkronisasi secara otomatis ke Google Sheets.
- **🔍 Filter Absensi**: Memudahkan admin untuk menyaring riwayat log absensi berdasarkan Tanggal atau Bulan.

---

## 🛠️ Tech Stack
* **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN), FontAwesome, Leaflet.js
* **Backend**: Google Apps Script (Node.js environment)
* **Database**: Google Sheets
* **Storage**: Google Drive (untuk penyimpanan foto selfie)

---

## 🚀 Panduan Instalasi (Deployment)

Ikuti langkah-langkah di bawah ini untuk menginstal dan menggunakan aplikasi ini.

### 1. Persiapan Database (Google Sheets)
1. Buat **Google Sheets** baru.
2. Buat 4 Sheet (Tab) di bawahnya dengan penamaan persis seperti ini:
   - `Users`
   - `Attendance`
   - `Permits`
   - `Settings`
3. Buat Header di Baris 1 untuk masing-masing Sheet:
   - **Users**: `id_user` | `nama` | `jabatan` | `nomor_hp` | `password` | `role` | `foto`
   - **Attendance**: `id_absen` | `id_user` | `tanggal` | `jam_masuk` | `jam_keluar` | `lat_in` | `lng_in` | `lat_out` | `lng_out` | `status` | `foto`
   - **Settings**: `key` | `value`
4. Di Sheet **Settings**, isi data default di baris 2, 3, dan 4:
   - Baris 2: Kolom A (`office_lat`), Kolom B (``)
   - Baris 3: Kolom A (`office_lng`), Kolom B (``)
   - Baris 4: Kolom A (`radius`), Kolom B (`100`)
5. Di Sheet **Users**, masukkan satu akun Admin default:
   - Baris 2: `1` | `Admin` | `Admin` | `0812345678` | `admin` | `admin` | *(kosongkan)*

### 2. Persiapan Folder Google Drive
1. Buat sebuah Folder di Google Drive (misal: `Foto_Presensi`).
2. Buka folder tersebut, dan perhatikan URL di browser Anda.
3. Copy ID Folder-nya (Karakter panjang setelah `folders/`).
4. Simpan ID Folder ini, Anda akan memasukkannya ke dalam kode Google Apps Script.

### 3. Deploy Google Apps Script
1. Dari Google Sheets, klik menu **Extensions > Apps Script**.
2. Ubah nama project di pojok kiri atas menjadi "Sistem Presensi v3".
3. Di panel sebelah kiri, buat dua file:
   - `Code.gs` (file Script bawaan)
   - `Index.html` (tambahkan file dengan klik tombol `+` > HTML)
4. Copy-paste *source code* backend ke `Code.gs`.
   - **PENTING**: Pada file `Code.gs`, cari variabel `DRIVE_FOLDER_ID` dan ganti nilainya dengan **ID Folder Google Drive** yang Anda copy pada langkah ke-2.
5. Copy-paste *source code* frontend ke `Index.html`.
6. Klik **Save** (Ctrl+S / Cmd+S).

### 4. Publikasi & Otorisasi
1. Klik tombol biru **Deploy** di pojok kanan atas, lalu pilih **New deployment**.
2. Pada ikon gerigi (Select type), centang **Web app**.
3. Isi kolom:
   - Description: `v1 Release`
   - Execute as: **Me** (Penting: Harus akun Anda sendiri).
   - Who has access: **Anyone** (Agar pegawai bisa mengakses tanpa login akun Google).
4. Klik **Deploy**.
5. Akan muncul pop-up **Authorize access**. Klik **Review Permissions** dan pilih akun Google Anda.
6. (Jika muncul peringatan "*Google hasn't verified this app*"), klik **Advanced** > **Go to Sistem Presensi v3 (unsafe)**.
7. Klik **Allow**.
8. Salin **Web app URL**. URL ini adalah link aplikasi yang akan Anda bagikan ke pegawai.

---

## 📖 Panduan Penggunaan (Manual)

### Akses Pegawai
1. Buka Web App URL di browser HP (Sangat disarankan menggunakan Google Chrome atau Safari versi terbaru).
2. Login menggunakan **Nomor HP** dan **Password** yang telah didaftarkan oleh admin.
3. Izinkan (Allow) akses Lokasi/GPS saat browser meminta perizinan.
4. **Absen Masuk**:
   - Pastikan indikator berbunyi **"LOKASI VALID"** (Anda berada dalam area kantor).
   - Klik **Absen Masuk**.
   - Sistem akan membuka kamera (Pilih kamera depan/selfie jika diminta).
   - Ambil foto dan tekan Submit.
5. **Absen Keluar**:
   - Jika sudah waktunya pulang, lakukan langkah yang sama seperti di atas, namun tombol akan berubah menjadi **Absen Keluar**.

### Akses Admin
1. Login menggunakan akun Role `admin` (Contoh default: No HP `0812345678`, Password `admin`).
2. Di bagian bawah layar, terdapat 5 menu navigasi:
   - 🏠 **Home**: Sama seperti antarmuka pegawai, digunakan jika admin ingin absen.
   - ⚙️ **Setting**: Digunakan untuk mengatur titik koordinat GPS kantor. Geser ikon 🏢 pada peta atau klik titik mana saja, atur besaran radius (meter), lalu klik **SIMPAN**.
   - 👥 **Pegawai**: Digunakan untuk menambah, mengedit, atau menghapus data pegawai dan akun loginnya.
   - 🕐 **Log**: Melihat log laporan riwayat kehadiran semua orang, yang dilengkapi dengan filter Tanggal dan Bulan.
   - ⏻ **Keluar**: Logout dari aplikasi.

---

## 🚨 Troubleshooting Umum
* **Peta tidak muncul**: Pastikan koneksi internet stabil (Leaflet membutuhkan koneksi untuk memuat layer peta OpenStreetMap).
* **Lokasi terus-menerus Invalid**: Pastikan GPS di HP dalam mode *High Accuracy*. Jika masih bermasalah, di luar ruangan biasanya sinyal GPS lebih akurat daripada di dalam gedung.
* **Gagal menyimpan foto**: Pastikan ID Folder Google Drive di `Code.gs` sudah benar dan folder tersebut tidak penuh (kuota Drive masih tersedia).

---
*Dibuat khusus untuk Sistem Informasi Manajemen Kepegawaian (Presensi Pro v3)*
