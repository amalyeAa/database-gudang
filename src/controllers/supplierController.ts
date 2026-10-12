import { Request, Response } from 'express';
import { pool } from '../db/pool.js';

// GET /api/supplier
export const getAllSupplier = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM supplier ORDER BY id_supplier ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// GET /api/supplier/:id
export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM supplier WHERE id_supplier = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// POST /api/supplier
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { nama_supplier, kontak, alamat } = req.body;
    if (!nama_supplier) {
      return res.status(400).json({ success: false, message: 'nama_supplier wajib diisi' });
    }
    const result = await pool.query(
      `INSERT INTO supplier (nama_supplier, kontak, alamat)
       VALUES ($1, $2, $3) RETURNING *`,
      [nama_supplier, kontak || null, alamat || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// PUT /api/supplier/:id
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nama_supplier, kontak, alamat } = req.body;
    const result = await pool.query(
      `UPDATE supplier
       SET nama_supplier = COALESCE($1, nama_supplier),
           kontak = COALESCE($2, kontak),
           alamat = COALESCE($3, alamat)
       WHERE id_supplier = $4 RETURNING *`,
      [nama_supplier, kontak, alamat, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// DELETE /api/supplier/:id
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM supplier WHERE id_supplier = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    }
    res.json({ success: true, message: 'Supplier berhasil dihapus', data: result.rows[0] });
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Supplier tidak bisa dihapus karena masih ada transaksi terkait',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};