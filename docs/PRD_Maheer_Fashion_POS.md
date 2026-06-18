# Product Requirements Document (PRD)
## Maheer Fashion POS — Sistem Point of Sale & Manajemen Inventaris

---

| Atribut | Detail |
|---|---|
| **Nama Produk** | Maheer Fashion POS |
| **Versi Dokumen** | 1.0.0 |
| **Tanggal** | 2 Mei 2026 |
| **Status** | Draft |
| **Tipe Aplikasi** | Web Application (SPA) |

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Permasalahan](#2-latar-belakang--permasalahan)
3. [Tujuan Produk](#3-tujuan-produk)
4. [Ruang Lingkup (Scope)](#4-ruang-lingkup-scope)
5. [Pengguna & Persona](#5-pengguna--persona)
6. [Arsitektur Sistem](#6-arsitektur-sistem)
7. [Modul & Fitur Aplikasi](#7-modul--fitur-aplikasi)
8. [Skema Database (ERD)](#8-skema-database-erd)
9. [Manajemen Pengguna & Hak Akses](#9-manajemen-pengguna--hak-akses)
10. [Wireframe & Desain Antarmuka](#10-wireframe--desain-antarmuka)
11. [Persyaratan Non-Fungsional](#11-persyaratan-non-fungsional)
12. [Teknologi Stack](#12-teknologi-stack)
13. [Kriteria Penerimaan (Acceptance Criteria)](#13-kriteria-penerimaan-acceptance-criteria)
14. [Risiko & Mitigasi](#14-risiko--mitigasi)
15. [Glossary](#15-glossary)

---

## 1. Ringkasan Eksekutif

**Maheer Fashion POS** adalah sistem transaksi dan manajemen inventaris berbasis web modern yang dirancang khusus untuk memenuhi kompleksitas bisnis fashion/pakaian. Dibangun menggunakan antarmuka **Next.js** yang responsif dan backend **Supabase** yang aman, aplikasi ini memungkinkan pengelola toko untuk:

- Memantau ribuan SKU dengan variasi warna dan ukuran secara terpusat.
- Mencatat transaksi secara **Omni-channel** (Offline, Shopee, TikTok Shop).
- Mendapatkan insight analitik penjualan secara **real-time** melalui dashboard visual.

Aplikasi ini bertujuan menggantikan pencatatan manual (buku/Excel) yang rentan terhadap human error, sekaligus menyediakan Business Intelligence bagi pemilik toko untuk pengambilan keputusan yang lebih baik.

---

## 2. Latar Belakang & Permasalahan

### 2.1 Kompleksitas Variasi Produk

Berbeda dengan bisnis ritel pada umumnya, produk fashion menuntut pelacakan berdasarkan **kombinasi dua dimensi variasi**: Ukuran (S, M, L, XL) dan Warna (Royal Blue, Mocca, dll.). Pencatatan manual menggunakan buku atau spreadsheet Excel sangat rentan menyebabkan **stok tidak selaras (human error)**, seperti:

- Overselling produk yang stoknya sudah habis.
- Kesalahan pencatatan akibat SKU yang mirip satu sama lain.
- Kesulitan melakukan audit stok secara akurat dan cepat.

### 2.2 Penjualan Omni-channel Tidak Terpusat

Di era digital, penjualan tidak hanya terfokus di satu titik. Maheer Fashion beroperasi di beberapa saluran penjualan secara bersamaan — toko fisik (offline), Shopee, dan TikTok Shop — yang menimbulkan tantangan:

- Data transaksi tersebar di berbagai platform yang berbeda.
- Tidak ada satu sumber kebenaran tunggal (*single source of truth*) untuk inventaris.
- Sulit membandingkan performa penjualan antar-channel secara apel-to-apel.

### 2.3 Keterbatasan Pengambilan Keputusan Bisnis

Manajer membutuhkan **visualisasi real-time** tentang:

- Tren pendapatan dan margin/profit bulanan.
- Stok produk *best-seller* yang hampir habis agar dapat segera direstok.
- Perbandingan kontribusi penjualan per channel.
- Analisis ukuran produk mana yang paling laris.

Tanpa sistem yang terintegrasi, keputusan bisnis sering kali bersifat reaktif dan kurang akurat.

---

## 3. Tujuan Produk

### 3.1 Tujuan Utama

> **Digitalisasi proses kasir dan pengelolaan gudang** untuk meningkatkan efisiensi waktu kalkulasi, menghindari selisih stok (*shrinkage*), dan mendongkrak margin keuntungan melalui *business intelligence* berbasis data.

### 3.2 Sasaran Terukur (OKR)

| Objective | Key Result |
|---|---|
| Eliminasi pencatatan manual | 100% transaksi tercatat secara digital dalam sistem |
| Akurasi inventaris | Selisih stok fisik vs. sistem < 1% |
| Efisiensi operasional kasir | Waktu proses per transaksi < 2 menit |
| Visibilitas bisnis | Dashboard real-time dapat diakses kapan saja |
| Sentralisasi omni-channel | Transaksi dari semua channel terhimpun dalam 1 database |

---

## 4. Ruang Lingkup (Scope)

### 4.1 Dalam Lingkup (In-Scope)

- Pengembangan antarmuka **Kasir (POS)** berbasis sentuhan/klik yang interaktif.
- **Sistem database terpusat** yang dapat diakses dari mana saja (cloud-based).
- **Modul manajemen data Master** untuk Produk & SKU.
- **Modul analitik dan laporan** berbentuk grafik interaktif (menggunakan Recharts).
- **Sistem autentikasi** dengan manajemen peran (Admin & Kasir).
- Dukungan **3 channel penjualan**: Offline, Shopee, TikTok Shop.

### 4.2 Di Luar Lingkup (Out-of-Scope)

- Integrasi API langsung dengan platform Shopee dan TikTok Shop (input dilakukan secara manual oleh kasir).
- Aplikasi mobile native (iOS/Android).
- Modul akuntansi lengkap (hutang, piutang, buku besar).
- Manajemen pengiriman/logistik.
- Integrasi payment gateway.

---

## 5. Pengguna & Persona

### 5.1 Persona 1 — Administrator (Owner/Manajer)

| Atribut | Detail |
|---|---|
| **Peran** | Pemilik toko / Manajer |
| **Kebutuhan Utama** | Melihat laporan keuangan, mengelola inventaris, mengatur akses staf |
| **Tujuan** | Mengambil keputusan bisnis berdasarkan data yang akurat |
| **Pain Point** | Tidak punya visibilitas performa toko secara real-time |
| **Akses** | Penuh ke semua modul sistem |

### 5.2 Persona 2 — Kasir (Staff)

| Atribut | Detail |
|---|---|
| **Peran** | Staf penjualan / Kasir |
| **Kebutuhan Utama** | Memproses transaksi dengan cepat dan akurat |
| **Tujuan** | Melayani pelanggan tanpa antrian panjang |
| **Pain Point** | Pencatatan manual yang lambat dan rentan kesalahan |
| **Akses** | Terbatas pada modul POS (input transaksi) |

---

## 6. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  Browser (Desktop / Tablet) — Next.js 14 (App Router)   │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP / HTTPS
┌───────────────────▼─────────────────────────────────────┐
│                  FRONTEND / UI LAYER                     │
│  React 18 + Next.js 14                                   │
│  Tailwind CSS + Radix UI + Base UI                       │
│  Framer Motion (animasi)                                 │
│  Recharts (visualisasi grafik)                           │
└───────────────────┬─────────────────────────────────────┘
                    │ Supabase SDK / REST API
┌───────────────────▼─────────────────────────────────────┐
│              DATA & AUTH LAYER (BACKEND)                 │
│  Supabase (PostgreSQL)                                   │
│  ├── Auth Module (Login / Register)                      │
│  ├── Row Level Security (RLS)                            │
│  └── Realtime Subscriptions                             │
└─────────────────────────────────────────────────────────┘
```

### 6.1 Frontend / UI Layer

- **Framework:** Next.js 14 dengan App Router untuk struktur komponen termodular dan render yang cepat.
- **Library UI:** React 18 sebagai fondasi komponen.

### 6.2 Styling Layer

- **CSS Framework:** Tailwind CSS untuk utility-first styling yang konsisten.
- **Komponen Headless:** Radix UI & Base UI untuk aksesibilitas dan fleksibilitas kustomisasi.
- **Animasi:** Framer Motion untuk transisi antarmuka yang halus.

### 6.3 Data & Auth Layer (Backend)

- **Database:** Supabase (PostgreSQL) sebagai sumber data terpusat berbasis cloud.
- **Autentikasi:** Supabase Auth untuk manajemen Login/Register yang aman.
- **Keamanan Data:** Row Level Security (RLS) untuk memastikan setiap pengguna hanya dapat mengakses data yang diotorisasi sesuai perannya.

---

## 7. Modul & Fitur Aplikasi

Aplikasi terdiri dari **4 modul pilar** utama:

---

### 7.1 Modul Autentikasi

**Deskripsi:** Antarmuka bagi Staff atau Admin untuk masuk ke sistem sebelum mengakses modul utama.

#### User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| AUTH-01 | Pengguna baru | Mendaftar akun baru | Dapat mengakses sistem |
| AUTH-02 | Pengguna terdaftar | Login dengan email & password | Dapat melakukan aktivitas sesuai peran |
| AUTH-03 | Pengguna | Logout dari sistem | Sesi saya aman setelah selesai bekerja |
| AUTH-04 | Admin | Menambah/mencabut akses pegawai | Saya bisa mengatur siapa yang masuk ke sistem |

#### Acceptance Criteria

- [ ] Formulir login menampilkan field email dan password.
- [ ] Login gagal menampilkan pesan error yang informatif.
- [ ] Setelah login berhasil, pengguna diarahkan sesuai perannya (Admin → Dashboard, Kasir → POS).
- [ ] Sesi pengguna tersimpan secara aman dan berakhir setelah logout.

---

### 7.2 Modul Dashboard (Analitik)

**Deskripsi:** Layar utama (Home) yang menyajikan statistik bisnis secara visual dan real-time, khusus untuk level Administrator.

#### Fitur

| ID | Fitur | Deskripsi |
|---|---|---|
| DASH-01 | Grafik Revenue & Profit | Grafik garis fluktuatif interaktif menampilkan perbandingan Pemasukan (Revenue) dan Keuntungan (Profit) selama 1 bulan terakhir. |
| DASH-02 | Pie Chart Channel Penjualan | Diagram lingkaran yang menampilkan persentase performa penjualan per channel (Offline, Shopee, TikTok Shop). |
| DASH-03 | Bar Chart Penjualan per Ukuran | Diagram batang komparatif untuk menyorot ukuran produk mana (S/M/L/XL) yang paling cepat terjual. |
| DASH-04 | Ringkasan KPI | Kartu statistik ringkas berisi total penjualan hari ini, total transaksi, dan produk hampir habis. |

#### User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| DASH-S01 | Admin | Melihat grafik pendapatan bulanan | Saya bisa mengevaluasi performa toko setiap bulan |
| DASH-S02 | Admin | Melihat kontribusi per channel penjualan | Saya tahu channel mana yang paling menguntungkan |
| DASH-S03 | Admin | Melihat ukuran produk terlaris | Saya bisa mengoptimalkan keputusan restock |

---

### 7.3 Modul POS (Point of Sale)

**Deskripsi:** Terminal antarmuka kasir. Tempat kasir melihat daftar produk, memasukkan pesanan, menentukan channel penjualan, dan menghitung total tagihan.

#### Fitur

| ID | Fitur | Deskripsi |
|---|---|---|
| POS-01 | Katalog Produk | Daftar produk dengan pencarian dan filter berdasarkan nama, SKU, ukuran, dan warna. |
| POS-02 | Keranjang Transaksi | Kasir dapat menambahkan produk ke keranjang, mengubah kuantitas, dan menghapus item. |
| POS-03 | Pilihan Channel | Kasir memilih saluran penjualan: Offline / Shopee / TikTok Shop. |
| POS-04 | Kalkulasi Total | Sistem otomatis menghitung subtotal, diskon (jika ada), dan total tagihan. |
| POS-05 | Konfirmasi Transaksi | Kasir mengonfirmasi transaksi yang kemudian tercatat di database dan stok otomatis berkurang. |
| POS-06 | Cetak/Simpan Nota | Struk transaksi dapat dicetak atau disimpan dalam sistem. |

#### User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| POS-S01 | Kasir | Mencari produk dengan cepat | Proses transaksi tidak memakan waktu lama |
| POS-S02 | Kasir | Memilih channel penjualan saat input | Data tersegmentasi per saluran secara otomatis |
| POS-S03 | Kasir | Melihat total harga secara otomatis | Saya tidak perlu menghitung manual |
| POS-S04 | Kasir | Menyelesaikan transaksi dengan satu klik | Stok langsung berkurang tanpa input ganda |

#### Acceptance Criteria

- [ ] Kasir dapat mencari produk berdasarkan nama atau SKU.
- [ ] Sistem mencegah transaksi jika stok produk = 0.
- [ ] Setelah transaksi dikonfirmasi, stok di database langsung berkurang sesuai kuantitas.
- [ ] Setiap transaksi tersimpan dengan timestamp, ID kasir, dan channel penjualan.

---

### 7.4 Modul Inventaris

**Deskripsi:** Tabel manajemen produk dan SKU. Digunakan oleh Admin untuk mengelola katalog produk, memperbarui stok, dan menetapkan harga.

#### Fitur

| ID | Fitur | Deskripsi |
|---|---|---|
| INV-01 | Daftar Produk & SKU | Tabel lengkap semua produk dengan filter dan pagination. |
| INV-02 | Tambah Produk Baru | Formulir untuk membuat produk baru beserta semua varian SKU-nya. |
| INV-03 | Edit Produk | Ubah atribut produk: nama, kategori, harga jual, harga pokok. |
| INV-04 | Restock Stok | Admin dapat menambah jumlah stok untuk SKU tertentu. |
| INV-05 | Hapus Produk | Admin dapat menonaktifkan atau menghapus produk dari katalog. |
| INV-06 | Peringatan Stok Rendah | Sistem memberi notifikasi/highlight produk dengan stok di bawah ambang batas tertentu. |

#### User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| INV-S01 | Admin | Menambah produk baru dengan varian ukuran dan warna | Semua SKU terdaftar sebelum dijual |
| INV-S02 | Admin | Mengubah harga jual produk | Harga di POS selalu update |
| INV-S03 | Admin | Melakukan restock stok produk | Stok di sistem sesuai dengan fisik di gudang |
| INV-S04 | Admin | Melihat produk yang hampir habis | Saya bisa melakukan pembelian ulang tepat waktu |

---

## 8. Skema Database (ERD)

Skema database terdiri dari **4 entitas logis utama** yang saling berelasi:

```
┌──────────────────┐       ┌──────────────────────┐
│      users       │       │       products        │
├──────────────────┤       ├──────────────────────┤
│ id (UUID) PK     │       │ id (UUID) PK          │
│ email            │       │ sku (e.g. GM-ALZ-XL)  │
│ role (enum)      │       │ name                  │
│ created_at       │       │ category              │
└────────┬─────────┘       │ size                  │
         │                 │ color                 │
         │ 1:N             │ current_stock (int)   │
         │                 │ initial_stock (int)   │
┌────────▼─────────┐       │ sell_price (decimal)  │
│   transactions   │       │ cost_price (decimal)  │
├──────────────────┤       │ is_active (bool)      │
│ id (UUID) PK     │       └──────────┬────────────┘
│ created_at       │                  │
│ channel (enum)   │                  │ 1:N
│ total_revenue    │       ┌──────────▼────────────┐
│ customer_id (opt)│       │  transaction_details  │
│ cashier_id FK    │◄──────┤ ├──────────────────────┤
└──────────────────┘  1:N  │ id (UUID) PK           │
                           │ transaction_id FK      │
                           │ product_id FK          │
                           │ quantity (int)         │
                           │ unit_price (decimal)   │
                           │ subtotal (decimal)     │
                           └───────────────────────┘
```

### 8.1 Tabel `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key, auto-generated |
| `email` | VARCHAR | Email unik pengguna untuk autentikasi |
| `role` | ENUM | Nilai: `admin` atau `cashier` |
| `created_at` | TIMESTAMP | Waktu akun dibuat |

### 8.2 Tabel `products`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key |
| `sku` | VARCHAR | Pengenal variasi absolut, format: `GM-ALZ-XL-RBL` |
| `name` | VARCHAR | Nama produk |
| `category` | VARCHAR | Kategori produk (contoh: Gamis, Hijab) |
| `size` | VARCHAR | Ukuran produk (S / M / L / XL) |
| `color` | VARCHAR | Nama warna produk |
| `current_stock` | INTEGER | Jumlah stok aktif saat ini |
| `initial_stock` | INTEGER | Stok awal / modal barang |
| `sell_price` | DECIMAL | Harga jual resmi |
| `cost_price` | DECIMAL | Harga pokok pembelian |
| `is_active` | BOOLEAN | Status aktif/nonaktif produk |

### 8.3 Tabel `transactions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key |
| `created_at` | TIMESTAMP | Tanggal dan waktu transaksi |
| `channel` | ENUM | Nilai: `offline`, `shopee`, `tiktok_shop` |
| `total_revenue` | DECIMAL | Nilai pendapatan total per struk |
| `customer_id` | UUID | ID pelanggan (opsional) |
| `cashier_id` | UUID | Foreign Key → `users.id` (kasir yang memproses) |

### 8.4 Tabel `transaction_details`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary Key |
| `transaction_id` | UUID | Foreign Key → `transactions.id` |
| `product_id` | UUID | Foreign Key → `products.id` |
| `quantity` | INTEGER | Jumlah item yang dibeli |
| `unit_price` | DECIMAL | Harga satuan saat transaksi dibuat (snapshot) |
| `subtotal` | DECIMAL | Hasil perkalian `quantity × unit_price` |

> **Catatan:** Tabel `transaction_details` berfungsi sebagai tabel relasi Many-to-Many antara `transactions` dan `products`, sehingga satu transaksi dapat mencakup lebih dari satu produk/SKU berbeda.

---

## 9. Manajemen Pengguna & Hak Akses

Untuk keamanan operasional toko, pengguna dibedakan menjadi **2 tingkat hak akses (Role)**:

### 9.1 Level Administrator (Owner / Manajer)

| Hak Akses | Deskripsi |
|---|---|
| ✅ Semua modul | Akses mutlak (100%) ke seluruh sistem |
| ✅ Laporan Margin Keuangan | Satu-satunya level yang dapat membaca laporan keuangan lengkap |
| ✅ Kelola Katalog | Dapat mengedit, menambah, dan menghapus produk dari katalog |
| ✅ Restock Produk | Dapat memperbarui stok produk |
| ✅ Kelola Pengguna | Dapat menambah atau mencabut akses pegawai |
| ✅ Dashboard Analitik | Dapat mengakses semua visualisasi data dan laporan |

### 9.2 Level Kasir (Cashier / Staff)

| Hak Akses | Deskripsi |
|---|---|
| ✅ Modul POS | Dapat membuka dan mengoperasikan antarmuka kasir |
| ✅ Input Transaksi | Dapat membuat transaksi penjualan baru |
| ❌ Laporan Keuangan | Tidak dapat mengakses laporan margin/keuangan |
| ❌ Edit Harga Master | Tidak dapat mengubah harga jual produk |
| ❌ Hapus Data Produk | Tidak dapat menghapus data dari katalog |
| ❌ Manajemen Pengguna | Tidak dapat mengatur akses akun lain |

> **Implementasi Keamanan:** Pembatasan akses diimplementasikan menggunakan **Row Level Security (RLS)** di Supabase, sehingga restriksi berlaku langsung di level database, bukan hanya di level UI.

---

## 10. Wireframe & Desain Antarmuka

### 10.1 Layout Global Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo "Maheer Fashion"          [Nama User] [Avatar] │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │              MAIN CONTENT AREA              │
│   (Vertikal) │                                              │
│              │                                              │
│ • Dashboard  │   (Konten berubah sesuai menu aktif)        │
│ • Inventory  │                                              │
│ • Purchasing │                                              │
│ • Zakat      │                                              │
│ • Sales      │                                              │
│ • Customer   │                                              │
│ • Report     │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Header:** Logo bisnis "Maheer Fashion" di kiri, ikon profil dan nama pengguna di pojok kanan untuk interaksi login/logout.
- **Sidebar:** Panel menu navigasi vertikal yang menempel di sisi kiri layar, memuat navigasi antar modul: Dashboard, Inventory, Purchasing, Zakat, Sales, Customer, Report.

---

### 10.2 Dashboard Analitik (Layar Utama)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
├──────────┬──────────────────────────────────────────────────┤
│          │  ┌──────────────────────────────────────────────┐│
│          │  │  GRAFIK GARIS — Revenue vs Profit (1 Bulan) ││
│ SIDEBAR  │  │                                              ││
│          │  └──────────────────────────────────────────────┘│
│          │                                                   │
│          │  ┌──────────────────┐  ┌───────────────────────┐ │
│          │  │   PIE CHART      │  │    BAR CHART          │ │
│          │  │ Channel Penjualan│  │  Penjualan per Ukuran │ │
│          │  │ (Offline/Shopee/ │  │  (S / M / L / XL)    │ │
│          │  │  TikTok Shop)    │  │                       │ │
│          │  └──────────────────┘  └───────────────────────┘ │
└──────────┴──────────────────────────────────────────────────┘
```

**Komponen Dashboard:**

1. **Grafik Garis Interaktif (Full-Width)** — Menampilkan perbandingan Revenue dan Profit selama 1 bulan dengan navigasi waktu.
2. **Pie Chart — Performa Channel** — Persentase kontribusi penjualan per channel (Offline vs Shopee vs TikTok Shop).
3. **Bar Chart — Penjualan per Ukuran** — Diagram batang komparatif untuk analisis ukuran produk yang paling cepat terjual.

---

### 10.3 Antarmuka POS (Kasir)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
├──────────┬──────────────────────┬──────────────────────────┤
│          │  KATALOG PRODUK      │   KERANJANG TRANSAKSI    │
│          │  ┌────────────────┐  │  ┌────────────────────┐  │
│ SIDEBAR  │  │ [Search/Filter]│  │  │ Item 1 — Qty — Hrg │  │
│          │  └────────────────┘  │  │ Item 2 — Qty — Hrg │  │
│          │                      │  │ ─────────────────── │  │
│          │  [Produk A] [Produk B]│  │ Subtotal: Rp.xxx   │  │
│          │  [Produk C] [Produk D]│  │                    │  │
│          │  [Produk E] [Produk F]│  │ Channel: [Offline▼]│  │
│          │                      │  │                    │  │
│          │                      │  │ TOTAL: Rp.xxx.xxx  │  │
│          │                      │  │ [PROSES TRANSAKSI] │  │
│          │                      │  └────────────────────┘  │
└──────────┴──────────────────────┴──────────────────────────┘
```

---

## 11. Persyaratan Non-Fungsional

### 11.1 Performa

| Metrik | Target |
|---|---|
| Waktu muat halaman pertama | < 3 detik pada koneksi 4G |
| Waktu respons API | < 500ms untuk operasi CRUD standar |
| Waktu proses transaksi kasir | < 2 menit per transaksi lengkap |

### 11.2 Ketersediaan (Availability)

- Uptime minimum **99.5%** per bulan (mengikuti SLA Supabase).
- Sistem dapat diakses dari berbagai perangkat modern (desktop, laptop, tablet).

### 11.3 Keamanan

- Seluruh komunikasi menggunakan **HTTPS/TLS**.
- Autentikasi menggunakan **Supabase Auth** dengan JWT Token.
- **Row Level Security (RLS)** aktif di semua tabel sensitif.
- Password pengguna disimpan dalam bentuk hash (tidak pernah plaintext).
- Sesi login berakhir otomatis setelah periode tidak aktif.

### 11.4 Skalabilitas

- Arsitektur mendukung penambahan channel penjualan baru tanpa perubahan besar pada skema database (penambahan nilai ENUM).
- Database PostgreSQL di Supabase dapat di-*scale up* sesuai pertumbuhan data.

### 11.5 Usability

- Antarmuka responsif dan dapat digunakan pada resolusi minimum **1280×720px**.
- Navigasi utama dapat diselesaikan dalam **maksimal 3 klik** dari layar mana pun.
- Sistem menyediakan feedback visual yang jelas untuk setiap aksi pengguna (loading state, success, error).

### 11.6 Kompatibilitas Browser

| Browser | Versi Minimum |
|---|---|
| Google Chrome | v110+ |
| Mozilla Firefox | v109+ |
| Microsoft Edge | v110+ |
| Safari | v16+ |

---

## 12. Teknologi Stack

| Layer | Teknologi | Versi | Keterangan |
|---|---|---|---|
| **Frontend Framework** | Next.js | 14 | App Router, SSR/SSG |
| **UI Library** | React | 18 | Component-based UI |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **Komponen Headless** | Radix UI / Base UI | Latest | Aksesibilitas |
| **Animasi** | Framer Motion | Latest | Transisi UI |
| **Grafik/Chart** | Recharts | Latest | Dashboard analitik |
| **Backend / Database** | Supabase (PostgreSQL) | Latest | BaaS + Auth + RLS |
| **Autentikasi** | Supabase Auth | Built-in | JWT + Session |
| **Deployment** | Vercel (rekomendasi) | — | Hosting Next.js optimal |

---

## 13. Kriteria Penerimaan (Acceptance Criteria)

### Modul Autentikasi

- [ ] Pengguna dapat login dengan email dan password yang valid.
- [ ] Login dengan kredensial salah menampilkan pesan error spesifik.
- [ ] Setelah login, pengguna diarahkan ke halaman sesuai perannya.
- [ ] Admin dapat menambah pengguna baru dengan role tertentu.
- [ ] Pengguna dapat logout dan sesi langsung berakhir.

### Modul Dashboard

- [ ] Grafik Revenue & Profit menampilkan data 30 hari terakhir secara akurat.
- [ ] Pie Chart menampilkan distribusi channel yang sesuai dengan data transaksi aktual.
- [ ] Bar Chart menampilkan data ukuran produk yang terjual.
- [ ] Dashboard hanya dapat diakses oleh pengguna dengan role `admin`.

### Modul POS

- [ ] Kasir dapat mencari produk berdasarkan nama atau SKU.
- [ ] Sistem menampilkan stok tersedia untuk setiap produk.
- [ ] Kasir tidak dapat memproses transaksi dengan stok = 0.
- [ ] Setelah transaksi berhasil, stok produk berkurang sesuai kuantitas yang dibeli.
- [ ] Setiap transaksi tercatat dengan timestamp, ID kasir, dan channel penjualan.

### Modul Inventaris

- [ ] Admin dapat menambah produk baru dengan semua atribut yang diperlukan.
- [ ] SKU divalidasi formatnya sebelum disimpan.
- [ ] Admin dapat melakukan restock dan stok bertambah sesuai nilai yang dimasukkan.
- [ ] Produk dengan stok di bawah ambang batas ditandai secara visual.
- [ ] Kasir tidak dapat mengakses modul inventaris.

---

## 14. Risiko & Mitigasi

| No | Risiko | Dampak | Probabilitas | Mitigasi |
|---|---|---|---|---|
| 1 | Koneksi internet terputus saat transaksi | Tinggi | Sedang | Tampilkan pesan error jelas, transaksi tidak tersimpan setengah |
| 2 | Ketidaksesuaian stok fisik vs sistem | Tinggi | Sedang | Fitur audit stok berkala + log perubahan stok |
| 3 | Akses tidak sah oleh kasir ke data keuangan | Tinggi | Rendah | RLS di database + pembatasan route di frontend |
| 4 | Performa lambat saat data produk banyak | Sedang | Sedang | Pagination, indexing database, lazy loading |
| 5 | Kesalahan input SKU duplikat | Sedang | Sedang | Validasi unik SKU di level database (UNIQUE constraint) |
| 6 | Data transaksi hilang akibat bug | Tinggi | Rendah | Backup otomatis Supabase + transaction atomicity |

---

## 15. Glossary

| Istilah | Definisi |
|---|---|
| **SKU** | Stock Keeping Unit — kode unik untuk mengidentifikasi satu varian produk spesifik (kombinasi nama, ukuran, warna). |
| **POS** | Point of Sale — sistem yang digunakan untuk memproses transaksi penjualan di titik interaksi dengan pelanggan. |
| **Omni-channel** | Strategi penjualan yang mengintegrasikan berbagai saluran penjualan (toko fisik, marketplace online) dalam satu sistem. |
| **RLS** | Row Level Security — fitur keamanan database PostgreSQL yang membatasi baris data mana yang dapat dibaca/ditulis oleh pengguna tertentu. |
| **Shrinkage** | Selisih antara stok yang tercatat di sistem dengan stok fisik yang sebenarnya ada di gudang. |
| **SPA** | Single-Page Application — aplikasi web yang memuat satu halaman HTML dan memperbarui konten secara dinamis tanpa reload penuh. |
| **BaaS** | Backend as a Service — layanan yang menyediakan infrastruktur backend siap pakai (database, auth, storage). |
| **ERD** | Entity Relationship Diagram — diagram yang menggambarkan struktur dan relasi antar entitas dalam database. |
| **Revenue** | Pendapatan kotor dari total penjualan sebelum dikurangi biaya. |
| **Margin/Profit** | Selisih antara harga jual dan harga pokok produk — keuntungan bersih per transaksi. |

---

*Dokumen ini merupakan PRD versi 1.0.0 untuk Maheer Fashion POS. Perubahan pada dokumen ini harus melalui proses review dan persetujuan dari stakeholder terkait.*
