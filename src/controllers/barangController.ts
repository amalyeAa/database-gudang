import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/barang — list semua barang
export const getAllBarang = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM barang ORDER BY id_barang ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/barang/:id — detail barang
export const getBarangById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM barang WHERE id_barang = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// POST /api/barang — tambah barang
export const createBarang = async (req: Request, res: Response) => {
  try {
    const { kode_barang, nama_barang, kategori, harga_satuan, stok, stok_minimum } = req.body;

    if (!kode_barang || !nama_barang || harga_satuan === undefined) {
      return res.status(400).json({
        success: false,
        message: 'kode_barang, nama_barang, dan harga_satuan wajib diisi',
      });
    }

    const result = await pool.query(
      `INSERT INTO barang (kode_barang, nama_barang, kategori, harga_satuan, stok, stok_minimum)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [kode_barang, nama_barang, kategori || null, harga_satuan, stok || 0, stok_minimum || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Kode barang sudah dipakai' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/barang/:id — update barang
export const updateBarang = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { kode_barang, nama_barang, kategori, harga_satuan, stok_minimum } = req.body;

    const result = await pool.query(
      `UPDATE barang
       SET kode_barang = COALESCE($1, kode_barang),
           nama_barang = COALESCE($2, nama_barang),
           kategori = COALESCE($3, kategori),
           harga_satuan = COALESCE($4, harga_satuan),
           stok_minimum = COALESCE($5, stok_minimum)
       WHERE id_barang = $6
       RETURNING *`,
      [kode_barang, nama_barang, kategori, harga_satuan, stok_minimum, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// DELETE /api/barang/:id — hapus barang
export const deleteBarang = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM barang WHERE id_barang = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }
    res.json({ success: true, message: 'Barang berhasil dihapus', data: result.rows[0] });
  } catch (error) {
    const err = error as Error & { code?: string };
    // 23503 = foreign key violation (barang masih dipakai di transaksi)
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Barang tidak bisa dihapus karena masih ada transaksi terkait',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/barang/stok-minimum — barang yang stoknya di bawah minimum
export const getStokMinimum = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM barang WHERE stok <= stok_minimum ORDER BY stok ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};