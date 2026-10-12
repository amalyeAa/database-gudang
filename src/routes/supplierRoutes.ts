import { Router } from 'express';
import {
  getAllSupplier,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

const router = Router();

router.get('/', getAllSupplier);
router.get('/:id', getSupplierById);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;