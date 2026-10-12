-- 1. Tabel Supplier --
CREATE TABLE IF NOT EXISTS supplier (
    id_supplier     SERIAL PRIMARY KEY,
    nama_supplier   VARCHAR(100) NOT NULL,
    kontak          VARCHAR(20),
    alamat          TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel Barang --
CREATE TABLE IF NOT EXISTS barang (
    id_barang       SERIAL PRIMARY KEY,
    kode_barang     VARCHAR(20) UNIQUE NOT NULL,
    nama_barang     VARCHAR(100) NOT NULL,
    kategori        VARCHAR(50),
    harga_satuan    NUMERIC(12,2) NOT NULL CHECK (harga_satuan >= 0),
    stok            INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
    stok_minimum    INTEGER NOT NULL DEFAULT 0 CHECK (stok_minimum >= 0),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 3. Tabel Barang Masuk --
CREATE TABLE IF NOT EXISTS barang_masuk (
    id_masuk        SERIAL PRIMARY KEY,
    id_barang       INTEGER NOT NULL REFERENCES barang(id_barang) ON DELETE RESTRICT,
    id_supplier     INTEGER NOT NULL REFERENCES supplier(id_supplier) ON DELETE RESTRICT,
    jumlah          INTEGER NOT NULL CHECK (jumlah > 0),
    harga_beli      NUMERIC(12,2) NOT NULL CHECK (harga_beli >= 0),
    tgl_masuk       TIMESTAMP DEFAULT NOW(),
    keterangan      TEXT
);

-- 4. Tabel Barang Keluar --
CREATE TABLE IF NOT EXISTS barang_keluar (
    id_keluar       SERIAL PRIMARY KEY,
    id_barang       INTEGER NOT NULL REFERENCES barang(id_barang) ON DELETE RESTRICT,
    jumlah          INTEGER NOT NULL CHECK (jumlah > 0),
    harga_jual      NUMERIC(12,2) NOT NULL CHECK (harga_jual >= 0),
    tgl_keluar      TIMESTAMP DEFAULT NOW(),
    tujuan          VARCHAR(100),
    keterangan      TEXT
);

-- INDEX untuk performa query --
CREATE INDEX IF NOT EXISTS idx_barang_kode ON barang(kode_barang);
CREATE INDEX IF NOT EXISTS idx_masuk_barang ON barang_masuk(id_barang);
CREATE INDEX IF NOT EXISTS idx_masuk_tgl ON barang_masuk(tgl_masuk);
CREATE INDEX IF NOT EXISTS idx_keluar_barang ON barang_keluar(id_barang);
CREATE INDEX IF NOT EXISTS idx_keluar_tgl ON barang_keluar(tgl_keluar);