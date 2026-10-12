import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/laporan/stok — laporan stok semua barang + status
export const laporanStok = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_barang,
        kode_barang,
        nama_barang,
        kategori,
        harga_satuan,
        stok,
        stok_minimum,
        (stok * harga_satuan) AS total_nilai_stok,
        CASE
          WHEN stok = 0 THEN 'Habis'
          WHEN stok <= stok_minimum THEN 'Menipis'
          ELSE 'Aman'
        END AS status_stok
      FROM barang
      ORDER BY 
        CASE
          WHEN stok = 0 THEN 1
          WHEN stok <= stok_minimum THEN 2
          ELSE 3
        END,
        nama_barang ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/laporan/transaksi?dari=YYYY-MM-DD&sampai=YYYY-MM-DD
export const laporanTransaksi = async (req: Request, res: Response) => {
  try {
    const { dari, sampai } = req.query;

    const masukQuery = `
      SELECT 
        'masuk' AS jenis,
        bm.id_masuk AS id_transaksi,
        bm.tgl_masuk AS tanggal,
        b.kode_barang,
        b.nama_barang,
        bm.jumlah,
        bm.harga_beli AS harga,
        s.nama_supplier AS pihak,
        bm.keterangan
      FROM barang_masuk bm
      JOIN barang b ON bm.id_barang = b.id_barang
      JOIN supplier s ON bm.id_supplier = s.id_supplier
      WHERE ($1::date IS NULL OR bm.tgl_masuk >= $1::date)
        AND ($2::date IS NULL OR bm.tgl_masuk <= $2::date + INTERVAL '1 day')
    `;

    const keluarQuery = `
      SELECT 
        'keluar' AS jenis,
        bk.id_keluar AS id_transaksi,
        bk.tgl_keluar AS tanggal,
        b.kode_barang,
        b.nama_barang,
        bk.jumlah,
        bk.harga_jual AS harga,
        bk.tujuan AS pihak,
        bk.keterangan
      FROM barang_keluar bk
      JOIN barang b ON bk.id_barang = b.id_barang
      WHERE ($1::date IS NULL OR bk.tgl_keluar >= $1::date)
        AND ($2::date IS NULL OR bk.tgl_keluar <= $2::date + INTERVAL '1 day')
    `;

    const result = await pool.query(`
      ${masukQuery}
      UNION ALL
      ${keluarQuery}
      ORDER BY tanggal DESC
    `, [dari || null, sampai || null]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/laporan/masuk?dari=...&sampai=...
export const laporanMasuk = async (req: Request, res: Response) => {
  try {
    const { dari, sampai } = req.query;
    const result = await pool.query(`
      SELECT 
        bm.id_masuk,
        bm.tgl_masuk,
        b.kode_barang,
        b.nama_barang,
        s.nama_supplier,
        bm.jumlah,
        bm.harga_beli,
        (bm.jumlah * bm.harga_beli) AS total,
        bm.keterangan
      FROM barang_masuk bm
      JOIN barang b ON bm.id_barang = b.id_barang
      JOIN supplier s ON bm.id_supplier = s.id_supplier
      WHERE ($1::date IS NULL OR bm.tgl_masuk >= $1::date)
        AND ($2::date IS NULL OR bm.tgl_masuk <= $2::date + INTERVAL '1 day')
      ORDER BY bm.tgl_masuk DESC
    `, [dari || null, sampai || null]);

    const total = result.rows.reduce((sum, row) => sum + Number(row.total), 0);
    res.json({ success: true, total_transaksi: result.rows.length, total_nilai: total, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/laporan/keluar?dari=...&sampai=...
export const laporanKeluar = async (req: Request, res: Response) => {
  try {
    const { dari, sampai } = req.query;
    const result = await pool.query(`
      SELECT 
        bk.id_keluar,
        bk.tgl_keluar,
        b.kode_barang,
        b.nama_barang,
        bk.tujuan,
        bk.jumlah,
        bk.harga_jual,
        (bk.jumlah * bk.harga_jual) AS total,
        bk.keterangan
      FROM barang_keluar bk
      JOIN barang b ON bk.id_barang = b.id_barang
      WHERE ($1::date IS NULL OR bk.tgl_keluar >= $1::date)
        AND ($2::date IS NULL OR bk.tgl_keluar <= $2::date + INTERVAL '1 day')
      ORDER BY bk.tgl_keluar DESC
    `, [dari || null, sampai || null]);

    const total = result.rows.reduce((sum, row) => sum + Number(row.total), 0);
    res.json({ success: true, total_transaksi: result.rows.length, total_nilai: total, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};