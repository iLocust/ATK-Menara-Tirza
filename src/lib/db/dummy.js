import { cashFlowService } from './CashFlowService';
import { stockService } from './StockService';
import { transactionService } from './TransactionService';

export async function addDummyData() {
  // Menambahkan dana awal cash
  const cashIncome = {
    type: 'income',
    amount: 2500000,
    description: 'Dana Awal Kas',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0]
  };
  
  await cashFlowService.addCashFlow(cashIncome);

  // Menambahkan dummy stok ATK
  const atkItems = [
    {
      produk: 'Pulpen',
      kategori: 'ATK',
      jumlah: 50,
      hargaBeli: 2000,
      hargaJual: 3000,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      batchNumber: 'ATK-001',
      sisaStok: 50 // Added this field for stock tracking
    },
    {
      produk: 'Buku Tulis',
      kategori: 'ATK',
      jumlah: 30,
      hargaBeli: 3500,
      hargaJual: 5000,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      batchNumber: 'ATK-002',
      sisaStok: 30 // Added this field for stock tracking
    }
  ];

  // Menambahkan dummy stok Seragam
  const seragamItems = [
    {
      produk: 'Seragam SD Putih',
      kategori: 'Seragam',
      jumlah: 20,
      hargaBeli: 45000,
      hargaJual: 60000,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      batchNumber: 'SRG-001',
      sisaStok: 20 // Added this field for stock tracking
    },
    {
      produk: 'Seragam SD Merah',
      kategori: 'Seragam',
      jumlah: 20,
      hargaBeli: 45000,
      hargaJual: 60000,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      batchNumber: 'SRG-002',
      sisaStok: 20 // Added this field for stock tracking
    }
  ];

  // Menambahkan semua item stok
  for (const item of [...atkItems, ...seragamItems]) {
    await stockService.addStokMasuk(item);
  }

  // Menambahkan dummy transaction
  const transactionData = {
    transactionId: 'TRX241201439',
    date: '2024-12-01',
    subtotal: 6000,
    cashAmount: 10000,
    change: 4000,
    paymentMethod: 'cash',
    status: 'completed'
  };

  const cart = [
    {
      id: 1,
      name: 'Pulpen',
      quantity: 2,
      price: 3000 // Using hargaJual from dummy data
    }
  ];

  // Process the transaction
  await transactionService.processTransaction(transactionData, cart);

  return {
    message: 'Data dummy berhasil ditambahkan!',
    details: {
      cashFlow: cashIncome,
      products: [...atkItems, ...seragamItems],
      transaction: {
        data: transactionData,
        items: cart
      }
    }
  };
}

// Add additional export for individual functions if needed
export async function addDummyTransaction() {
  const transactionData = {
    transactionId: 'TRX241201439',
    date: '2024-12-01',
    subtotal: 6000,
    cashAmount: 10000,
    change: 4000,
    paymentMethod: 'cash',
    status: 'completed'
  };

  const cart = [
    {
      id: 1,
      name: 'Pulpen',
      quantity: 2,
      price: 3000
    }
  ];

  try {
    await transactionService.processTransaction(transactionData, cart);
    return {
      message: 'Dummy transaction successfully added!',
      details: {
        transaction: transactionData,
        items: cart
      }
    };
  } catch (error) {
    console.error('Failed to add dummy transaction:', error);
    throw error;
  }
}