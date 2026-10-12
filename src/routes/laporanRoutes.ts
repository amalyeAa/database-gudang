import { Router } from 'express';
import {
  laporanStok,
  laporanTransaksi,
  laporanMasuk,
  laporanKeluar,
} from '../controllers/laporanController.js';

const router = Router();

router.get('/stok', laporanStok);
router.get('/transaksi', laporanTransaksi);
router.get('/masuk', laporanMasuk);
router.get('/keluar', laporanKeluar);

export default router;