# ATK Menara Tirza - Sistem Manajemen Koperasi

Aplikasi web untuk mengelola operasional koperasi sekolah dengan fitur manajemen produk, stok, penjualan, dan laporan keuangan.

## Tech Stack

- **Frontend**: React 18 + Vite
- **State Management**: Redux Toolkit
- **Database**: IndexedDB (PWA-ready)
- **UI**: Tailwind CSS + Radix UI
- **Charts**: Recharts, ApexCharts
- **Export**: ExcelJS

## Fitur Utama

### 📊 Dashboard
- Statistik keuangan (pendapatan, pengeluaran, saldo)
- Grafik cash flow harian
- Analisis laba rugi dan margin
- Monitoring stok (produk habis/menipis)
- Perbandingan bulanan

### 📦 Manajemen Produk
- Katalog produk dengan pencarian
- Filter berdasarkan kategori
- Tampilan stok real-time

### 📥 Stok Masuk
- Input stok masuk dengan barcode (8-13 digit)
- Update harga jual dan margin
- Restock produk
- Import/Export Excel
- Validasi barcode duplikat

### 🛒 Penjualan
- Sistem POS dengan barcode scanner
- Shopping cart
- Validasi stok real-time
- Multiple payment method (tunai/transfer)

### 💰 Pembayaran
- Proses pembayaran transaksi
- Pilihan metode pembayaran
- Tracking saldo kas

### 📋 Transaksi
- Riwayat transaksi lengkap
- Filter berdasarkan tanggal
- Detail transaksi

### 💵 Manajemen Kas
- Tracking cash flow (pemasukan/pengeluaran)
- Saldo tunai dan transfer terpisah
- Pencatatan transaksi keuangan

### 📈 Laporan
- Laporan penjualan
- Export ke Excel
- Analisis performa produk

## Instalasi

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Struktur Database

- `stokMasuk` - Data stok masuk
- `products` - Master produk
- `transaksi` - Header transaksi
- `transaksiDetail` - Detail transaksi
- `cashFlow` - Cash flow records

## Catatan

- Data disimpan di browser (IndexedDB)
- Aplikasi berjalan offline
- Barcode scanner menggunakan keyboard input (Enter untuk submit)
