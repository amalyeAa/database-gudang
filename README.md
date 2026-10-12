# Sistem Inventaris Gudang — Backend API

Backend API untuk Sistem Inventaris Gudang sederhana. Dibuat dengan **Node.js + TypeScript + Express 5 + PostgreSQL**.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript (via `tsx`)
- **Framework:** Express 5
- **Database:** PostgreSQL
- **Driver:** `pg` (node-postgres)

## 📋 Fitur

- ✅ CRUD Barang
- ✅ CRUD Supplier
- ✅ Transaksi Barang Masuk (auto-tambah stok)
- ✅ Transaksi Barang Keluar (validasi stok — anti minus)
- ✅ Laporan Stok dengan status otomatis (Aman/Menipis/Habis)
- ✅ Laporan Transaksi dengan filter tanggal
- ✅ Database transaction untuk konsistensi data

## 🚀 Cara Menjalankan

### 1. Prasyarat

- Node.js v18+
- PostgreSQL v14+

### 2. Setup Database

Buat database `db_gudang` di PostgreSQL, lalu jalankan script:
```bash
psql -U postgres -d db_gudang -f src/db/schema.sql
```

Atau copy-paste isi `src/db/schema.sql` ke DBeaver/pgAdmin.

### 3. Setup Environment

Copy `.env.example` jadi `.env`, lalu isi:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=db_gudang
```

### 4. Install & Jalankan

```bash
npm install
npm run dev
```

Server jalan di `http://localhost:3000`.

## 📚 API Endpoints

### Barang
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/barang` | List semua barang |
| GET | `/api/barang/:id` | Detail barang |
| POST | `/api/barang` | Tambah barang |
| PUT | `/api/barang/:id` | Update barang |
| DELETE | `/api/barang/:id` | Hapus barang |
| GET | `/api/barang/stok-minimum` | Barang stok menipis |

### Supplier
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/supplier` | List semua supplier |
| GET | `/api/supplier/:id` | Detail supplier |
| POST | `/api/supplier` | Tambah supplier |
| PUT | `/api/supplier/:id` | Update supplier |
| DELETE | `/api/supplier/:id` | Hapus supplier |

### Barang Masuk
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/barang-masuk` | List transaksi masuk |
| GET | `/api/barang-masuk/:id` | Detail transaksi |
| POST | `/api/barang-masuk` | Catat barang masuk (auto + stok) |
| DELETE | `/api/barang-masuk/:id` | Hapus (auto - stok) |

### Barang Keluar
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/barang-keluar` | List transaksi keluar |
| GET | `/api/barang-keluar/:id` | Detail transaksi |
| POST | `/api/barang-keluar` | Catat barang keluar (validasi stok) |
| DELETE | `/api/barang-keluar/:id` | Hapus (auto + stok) |

### Laporan
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/laporan/stok` | Laporan stok semua barang |
| GET | `/api/laporan/transaksi?dari=&sampai=` | Laporan semua transaksi |
| GET | `/api/laporan/masuk?dari=&sampai=` | Laporan barang masuk |
| GET | `/api/laporan/keluar?dari=&sampai=` | Laporan barang keluar |

## 🔒 Fitur Anti-Celah

- **Stok tidak bisa minus** — `CHECK (stok >= 0)` + validasi di controller
- **Database transaction** — insert transaksi + update stok dalam 1 transaksi
- **Row locking (`FOR UPDATE`)** — cegah race condition saat concurrent
- **Foreign key constraint** — cegah data orphan
- **Unique constraint** — `kode_barang` harus unik
- **Audit trail** — timestamp di semua tabel