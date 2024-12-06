export const DB_CONFIG = {
  name: 'KoperasiDB',
  version: 5, // Increment version untuk memicu pembaruan schema
  stores: {
    stokMasuk: {
      name: 'stokMasuk',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'tanggalMasuk', keyPath: 'tanggalMasuk', options: { unique: false } },
        { name: 'kategori', keyPath: 'kategori', options: { unique: false } },
        { name: 'produk', keyPath: 'produk', options: { unique: false } }
      ]
    },
    products: {
      name: 'products',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'name', keyPath: 'name', options: { unique: false } },
        { name: 'price', keyPath: 'price', options: { unique: false } },
        { name: 'stock', keyPath: 'stock', options: { unique: false } },
        { name: 'kategori', keyPath: 'kategori', options: { unique: false } }
      ]
    },
    transaksi: {
      name: 'transaksi',
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        { name: 'date', keyPath: 'date', options: { unique: false } },
        { name: 'status', keyPath: 'status', options: { unique: false } },
        { name: 'paymentMethod', keyPath: 'paymentMethod', options: { unique: false } }
      ]
    },
    transaksiDetail: {
      name: 'transaksiDetail',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'transaksiId', keyPath: 'transaksiId', options: { unique: false } },
        { name: 'productId', keyPath: 'productId', options: { unique: false } }
      ]
    },
    cashFlow: {
      name: 'cashFlow',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'type', keyPath: 'type', options: { unique: false } },
        { name: 'date', keyPath: 'date', options: { unique: false } },
        { name: 'transactionId', keyPath: 'transactionId', options: { unique: false } },
        { name: 'paymentMethod', keyPath: 'paymentMethod', options: { unique: false } }
      ]
    },
    transferFlow: {
      name: 'transferFlow',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'type', keyPath: 'type', options: { unique: false } },
        { name: 'date', keyPath: 'date', options: { unique: false } },
        { name: 'transactionId', keyPath: 'transactionId', options: { unique: false } },
        { name: 'bankAccount', keyPath: 'bankAccount', options: { unique: false } }
      ]
    },
    monthlyBalance: {
      name: 'monthlyBalance',
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'date', keyPath: 'date', options: { unique: false } },
        { name: 'monthKey', keyPath: 'monthKey', options: { unique: true } },
        { name: 'cashIncome', keyPath: 'cashIncome', options: { unique: false } },
        { name: 'cashExpense', keyPath: 'cashExpense', options: { unique: false } },
        { name: 'transferIncome', keyPath: 'transferIncome', options: { unique: false } },
        { name: 'transferExpense', keyPath: 'transferExpense', options: { unique: false } }
      ]
    }
  }
};