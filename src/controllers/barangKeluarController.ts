import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/barang-keluar
export const getAllBarangKeluar = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT bk.*, b.kode_barang, b.nama_barang
      FROM barang_keluar bk
      JOIN barang b ON bk.id_barang = b.id_barang
      ORDER BY bk.id_keluar DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/barang-keluar/:id
export const getBarangKeluarById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT bk.*, b.kode_barang, b.nama_barang
      FROM barang_keluar bk
      JOIN barang b ON bk.id_barang = b.id_barang
      WHERE bk.id_keluar = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// POST /api/barang-keluar — VALIDASI STOK CUKUP
export const createBarangKeluar = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id_barang, jumlah, harga_jual, tujuan, keterangan } = req.body;

    if (!id_barang || !jumlah || harga_jual === undefined) {
      return res.status(400).json({
        success: false,
        message: 'id_barang, jumlah, dan harga_jual wajib diisi',
      });
    }
    if (jumlah <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah harus lebih dari 0' });
    }

    await client.query('BEGIN');

    // Cek barang ada + lock row buat cegah race condition
    const barangCheck = await client.query(
      'SELECT * FROM barang WHERE id_barang = $1 FOR UPDATE',
      [id_barang]
    );
    if (barangCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    const barang = barangCheck.rows[0];

    // 🔒 VALIDASI STOK — ini kunci anti-celah
    if (barang.stok < jumlah) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Stok tidak cukup. Stok tersedia: ${barang.stok}, diminta: ${jumlah}`,
      });
    }

    // Insert transaksi keluar
    const insertResult = await client.query(
      `INSERT INTO barang_keluar (id_barang, jumlah, harga_jual, tujuan, keterangan)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_barang, jumlah, harga_jual, tujuan || null, keterangan || null]
    );

    // Update stok (KURANGI)
    await client.query(
      'UPDATE barang SET stok = stok - $1 WHERE id_barang = $2',
      [jumlah, id_barang]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Barang keluar berhasil dicatat & stok berkurang',
      data: insertResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};

// DELETE /api/barang-keluar/:id — hapus + balikin stok
export const deleteBarangKeluar = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const check = await client.query('SELECT * FROM barang_keluar WHERE id_keluar = $1', [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    const transaksi = check.rows[0];

    // Balikin stok
    await client.query(
      'UPDATE barang SET stok = stok + $1 WHERE id_barang = $2',
      [transaksi.jumlah, transaksi.id_barang]
    );

    // Hapus transaksi
    await client.query('DELETE FROM barang_keluar WHERE id_keluar = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Transaksi dihapus & stok dikembalikan' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    client.release();
  }
};