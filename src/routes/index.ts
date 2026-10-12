import { Router } from 'express';
import barangRoutes from './barangRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import barangMasukRoutes from './barangMasukRoutes.js';
import barangKeluarRoutes from './barangKeluarRoutes.js';
import laporanRoutes from './laporanRoutes.js';

const router = Router();

router.use('/barang', barangRoutes);
router.use('/supplier', supplierRoutes);
router.use('/barang-masuk', barangMasukRoutes);
router.use('/barang-keluar', barangKeluarRoutes);
router.use('/laporan', laporanRoutes);

export default router;