import { Router } from 'express';
import {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  getStokMinimum,
} from '../controllers/barangController.js';

const router = Router();

// PENTING: route /stok-minimum harus DI ATAS /:id
// biar "stok-minimum" nggak dianggap sebagai :id
router.get('/stok-minimum', getStokMinimum);

router.get('/', getAllBarang);
router.get('/:id', getBarangById);
router.post('/', createBarang);
router.put('/:id', updateBarang);
router.delete('/:id', deleteBarang);

export default router;