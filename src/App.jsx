import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Produk';
import StokMasuk from './pages/StokMasuk';
import Penjualan from './pages/Penjualan';
import Pembayaran from './pages/penjualan/pembayaran';
import RiwayatTransaksi from './pages/penjualan/riwayat-transaksi';
import CashBalance from './pages/Cash';
import SalesReport from './pages/SalesReport';

function App() {
  useEffect(() => {
    const setupCapacitor = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const { App: CapacitorApp } = await import('@capacitor/app');

        if (Capacitor.getPlatform() === 'android') {
          CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              CapacitorApp.exitApp();
            } else {
              window.history.back();
            }
          });
        }
      } catch (error) {
        console.error('Capacitor initialization error:', error);
      }
    };

    setupCapacitor();
  }, []);

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