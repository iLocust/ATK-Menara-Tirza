import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Produk';
import { KartuStok } from './pages/KartuStok';
import { StokMasuk } from './pages/StokMasuk';
import Penjualan from './pages/Penjualan';
import Pembayaran from './pages/penjualan/pembayaran';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produk" element={<Products />} />
          <Route path="/inventori/kartu-stok" element={<KartuStok />} />
          <Route path="/inventori/stok-masuk" element={<StokMasuk />} />
          <Route path="/penjualan" element={<Penjualan />} />
          <Route path="/penjualan/pembayaran" element={<Pembayaran />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;