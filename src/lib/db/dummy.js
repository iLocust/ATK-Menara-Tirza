import { cashFlowService } from './CashFlowService';
import { stockService } from './StockService';
import { transactionService } from './TransactionService';

export async function addDummyData() {
  const currentDate = new Date();
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const cashIncome = {
    type: 'income',
    amount: 10000000,
    description: 'Dana Awal Kas',
    paymentMethod: 'cash',
    date: currentDate.toISOString().split('T')[0]
  };
  
  await cashFlowService.addCashFlow(cashIncome);

  const atkItems = [
    {
      produk: 'Pulpen',
      kategori: 'ATK',
      jumlah: 100,
      hargaBeli: 2000,
      hargaJual: 3000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'ATK-001',
      sisaStok: 100
    },
    {
      produk: 'Buku Tulis',
      kategori: 'ATK', 
      jumlah: 200,
      hargaBeli: 3500,
      hargaJual: 5000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'ATK-002',
      sisaStok: 200
    },
    {
      produk: 'Pensil',
      kategori: 'ATK',
      jumlah: 150,
      hargaBeli: 1500,
      hargaJual: 2500,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'ATK-003',
      sisaStok: 150
    },
    {
      produk: 'Penghapus',
      kategori: 'ATK',
      jumlah: 100,
      hargaBeli: 1000,
      hargaJual: 2000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'ATK-004',
      sisaStok: 100
    },
    {
      produk: 'Penggaris',
      kategori: 'ATK',
      jumlah: 35,
      hargaBeli: 2500,
      hargaJual: 4000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'ATK-005',
      sisaStok: 75
    }
  ];

  const seragamItems = [
    {
      produk: 'Seragam SD Putih (S)',
      kategori: 'Seragam',
      jumlah: 20,
      hargaBeli: 75000,
      hargaJual: 90000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'SRG-001',
      sisaStok: 50
    },
    {
      produk: 'Seragam SD Putih (M)',
      kategori: 'Seragam',
      jumlah: 10,
      hargaBeli: 75000,
      hargaJual: 90000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'SRG-002',
      sisaStok: 50
    },
    {
      produk: 'Seragam SD Merah (S)',
      kategori: 'Seragam',
      jumlah: 12,
      hargaBeli: 75000,
      hargaJual: 90000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'SRG-003',
      sisaStok: 50
    },
    {
      produk: 'Seragam SD Merah (M)',
      kategori: 'Seragam',
      jumlah: 13,
      hargaBeli: 75000,
      hargaJual: 90000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'SRG-004',
      sisaStok: 50
    },
    {
      produk: 'Seragam Olahraga (S)',
      kategori: 'Seragam',
      jumlah: 30,
      hargaBeli: 65000,
      hargaJual: 80000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'SRG-005',
      sisaStok: 60
    },
    {
      produk: 'Seragam Olahraga (M)',
      kategori: 'Seragam',
      jumlah: 10,
      hargaBeli: 65000,
      hargaJual: 80000,
      tanggalMasuk: currentDate.toISOString().split('T')[0],
      batchNumber: 'SRG-006',
      sisaStok: 60
    }
  ];

  for (const item of [...atkItems, ...seragamItems]) {
    await stockService.addStokMasuk(item);
  }

  // Dummy transactions for today
  const todayTransactions = [
    {
      transactionId: `TRX-${currentDate.getTime()}-1`,
      date: currentDate.toISOString().split('T')[0],
      subtotal: 23000,
      paymentMethod: 'cash',
      status: 'completed',
      cashAmount: 25000,
      change: 2000,
      cart: [
        {
          id: 1,
          name: 'Pulpen',
          quantity: 3,
          price: 3000,
          kategori: 'ATK'
        },
        {
          id: 2,
          name: 'Buku Tulis',
          quantity: 2,
          price: 5000,
          kategori: 'ATK'
        },
        {
          id: 3,
          name: 'Pensil',
          quantity: 2,
          price: 2500,
          kategori: 'ATK'
        }
      ]
    },
    {
      transactionId: `TRX-${currentDate.getTime()}-2`,
      date: currentDate.toISOString().split('T')[0],
      subtotal: 340000,
      paymentMethod: 'transfer',
      status: 'completed',
      cashAmount: 340000,
      change: 0,
      cart: [
        {
          id: 4,
          name: 'Seragam SD Putih (S)',
          quantity: 2,
          price: 90000,
          kategori: 'Seragam'
        },
        {
          id: 5,
          name: 'Seragam Olahraga (S)',
          quantity: 2,
          price: 80000,
          kategori: 'Seragam'
        }
      ]
    }
  ];

  // Dummy transactions for yesterday
  const yesterdayTransactions = [
    {
      transactionId: `TRX-${yesterday.getTime()}-1`,
      date: yesterday.toISOString().split('T')[0],
      subtotal: 18000,
      paymentMethod: 'cash',
      status: 'completed',
      cashAmount: 20000,
      change: 2000,
      cart: [
        {
          id: 1,
          name: 'Pulpen',
          quantity: 2,
          price: 3000,
          kategori: 'ATK'
        },
        {
          id: 2,
          name: 'Penghapus',
          quantity: 3,
          price: 2000,
          kategori: 'ATK'
        },
        {
          id: 3,
          name: 'Penggaris',
          quantity: 2,
          price: 4000,
          kategori: 'ATK'
        }
      ]
    },
    {
      transactionId: `TRX-${yesterday.getTime()}-2`,
      date: yesterday.toISOString().split('T')[0],
      subtotal: 170000,
      paymentMethod: 'transfer',
      status: 'completed',
      cashAmount: 170000,
      change: 0,
      cart: [
        {
          id: 4,
          name: 'Seragam SD Merah (M)',
          quantity: 1,
          price: 90000,
          kategori: 'Seragam'
        },
        {
          id: 5,
          name: 'Seragam Olahraga (M)',
          quantity: 1,
          price: 80000,
          kategori: 'Seragam'
        }
      ]
    }
  ];

  for (const transaction of [...todayTransactions, ...yesterdayTransactions]) {
    await transactionService.processTransaction(transaction, transaction.cart);
  }

  return {
    message: 'Data dummy berhasil ditambahkan!',
    details: {
      initialBalance: {
        cash: cashIncome,
      },
      products: {
        atk: atkItems,
        seragam: seragamItems
      },
      transactions: {
        today: todayTransactions,
        yesterday: yesterdayTransactions
      }
    }
  };
}