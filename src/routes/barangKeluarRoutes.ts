import { Router } from 'express';
import {
  getAllBarangKeluar,
  getBarangKeluarById,
  createBarangKeluar,
  deleteBarangKeluar,
} from '../controllers/barangKeluarController.js';

const router = Router();

router.get('/', getAllBarangKeluar);
router.get('/:id', getBarangKeluarById);
router.post('/', createBarangKeluar);
router.delete('/:id', deleteBarangKeluar);

export default router;