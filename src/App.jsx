import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Produk';
import StokMasuk from '@/pages/StokMasuk/StokMasuk';
import Penjualan from '@/pages/Sales/index';
import Pembayaran from '@/pages/Sales/pembayaran';
import RiwayatTransaksi from '@/pages/Transactions/riwayat-transaksi';
import CashBalance from '@/pages/Transactions/Cash';
import SalesReport from '@/pages/Transactions/SalesReport';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produk" element={<Products />} />
          <Route path="/inventori/stok-masuk" element={<StokMasuk />} />
          <Route path="/penjualan" element={<Penjualan />} />
          <Route path="/riwayat-transaksi" element={<RiwayatTransaksi />} />
          <Route path="/penjualan/pembayaran" element={<Pembayaran />} />
          <Route path="/kas" element={<CashBalance />} />
          <Route path="/report" element={<SalesReport />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;