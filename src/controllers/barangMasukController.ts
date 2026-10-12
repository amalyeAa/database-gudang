import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/barang-masuk — list semua transaksi masuk
export const getAllBarangMasuk = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT bm.*, b.kode_barang, b.nama_barang, s.nama_supplier
      FROM barang_masuk bm
      JOIN barang b ON bm.id_barang = b.id_barang
      JOIN supplier s ON bm.id_supplier = s.id_supplier
      ORDER BY bm.id_masuk DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/barang-masuk/:id
export const getBarangMasukById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT bm.*, b.kode_barang, b.nama_barang, s.nama_supplier
      FROM barang_masuk bm
      JOIN barang b ON bm.id_barang = b.id_barang
      JOIN supplier s ON bm.id_supplier = s.id_supplier
      WHERE bm.id_masuk = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// POST /api/barang-masuk — tambah transaksi + auto update stok
export const createBarangMasuk = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id_barang, id_supplier, jumlah, harga_beli, keterangan } = req.body;

    // Validasi input
    if (!id_barang || !id_supplier || !jumlah || harga_beli === undefined) {
      return res.status(400).json({
        success: false,
        message: 'id_barang, id_supplier, jumlah, dan harga_beli wajib diisi',
      });
    }
    if (jumlah <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0' });
    }

    // Mulai transaction
    await client.query('BEGIN');

    // Cek barang ada
    const barangCheck = await client.query('SELECT * FROM barang WHERE id_barang = $1', [id_barang]);
    if (barangCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    // Cek supplier ada
    const supplierCheck = await client.query('SELECT * FROM supplier WHERE id_supplier = $1', [id_supplier]);
    if (supplierCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }

    // Insert transaksi masuk
    const insertResult = await client.query(
      `INSERT INTO barang_masuk (id_barang, id_supplier, jumlah, harga_beli, keterangan)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_barang, id_supplier, jumlah, harga_beli, keterangan || null]
    );

    // Update stok barang (TAMBAH)
    await client.query(
      'UPDATE barang SET stok = stok + $1 WHERE id_barang = $2',
      [jumlah, id_barang]
    );

    // Commit
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Barang masuk berhasil dicatat & stok bertambah',
      data: insertResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

// DELETE /api/barang-masuk/:id — hapus + kurangi stok balik
export const deleteBarangMasuk = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    // Cek transaksi ada
    const check = await client.query('SELECT * FROM barang_masuk WHERE id_masuk = $1', [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    const transaksi = check.rows[0];

    // Cek stok cukup buat dikurangi balik
    const barangCheck = await client.query('SELECT stok FROM barang WHERE id_barang = $1', [transaksi.id_barang]);
    if (barangCheck.rows[0].stok < transaksi.jumlah) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Tidak bisa hapus: stok saat ini lebih kecil dari jumlah transaksi (barang mungkin sudah keluar)',
      });
    }

    // Kurangi stok balik
    await client.query(
      'UPDATE barang SET stok = stok - $1 WHERE id_barang = $2',
      [transaksi.jumlah, transaksi.id_barang]
    );

    // Hapus transaksi
    await client.query('DELETE FROM barang_masuk WHERE id_masuk = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Transaksi dihapus & stok dikurangi balik' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};