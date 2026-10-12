import { Router } from 'express';
import {
  getAllBarangMasuk,
  getBarangMasukById,
  createBarangMasuk,
  deleteBarangMasuk,
} from '../controllers/barangMasukController.js';

const router = Router();

router.get('/', getAllBarangMasuk);
router.get('/:id', getBarangMasukById);
router.post('/', createBarangMasuk);
router.delete('/:id', deleteBarangMasuk);

export default router;