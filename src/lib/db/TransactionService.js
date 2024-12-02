import { dbService } from './db-service';

class TransactionService {
  async getAllTransactions() {
    const transactions = await dbService.getAll('transaksi');
    for (let transaction of transactions) {
      transaction.items = await this.getTransactionDetails(transaction.id);
    }
    return transactions;
  }

  async getTransactionsByDateRange(startDate, endDate) {
    const allTransactions = await this.getAllTransactions();
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= new Date(startDate) && 
             transactionDate <= new Date(endDate);
    });
  }

  async getTransactionDetails(transactionId) {
    return dbService.getAllFromIndex('transaksiDetail', 'transaksiId', transactionId);
  }

  async processTransaction(transactionData, cart) {
    const transaction = dbService.db.transaction(
      ['transaksi', 'transaksiDetail', 'stokMasuk', 'products', 'cashFlow'],
      'readwrite'
    );

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject('Transaction failed');
      transaction.oncomplete = () => resolve('Transaction completed');

      try {
        const transaksiStore = transaction.objectStore('transaksi');
        const detailStore = transaction.objectStore('transaksiDetail');
        const stokMasukStore = transaction.objectStore('stokMasuk');
        const productsStore = transaction.objectStore('products');
        const cashFlowStore = transaction.objectStore('cashFlow');

        transaksiStore.add({
          id: transactionData.transactionId,
          date: transactionData.date,
          total: transactionData.subtotal,
          paymentMethod: transactionData.paymentMethod,
          status: transactionData.status,
          cashAmount: transactionData.cashAmount,
          change: transactionData.change
        });

        cart.forEach(async (item) => {
          detailStore.add({
            transaksiId: transactionData.transactionId,
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          });

          const getStockRequest = stokMasukStore.index('produk').getAll(item.name);
          
          getStockRequest.onsuccess = (event) => {
            let remainingQty = item.quantity;
            const batches = event.target.result
              .filter(batch => batch.sisaStok > 0)
              .sort((a, b) => new Date(a.tanggalMasuk) - new Date(b.tanggalMasuk));

            batches.forEach(batch => {
              if (remainingQty > 0) {
                const qtyToReduce = Math.min(remainingQty, batch.sisaStok);
                batch.sisaStok -= qtyToReduce;
                remainingQty -= qtyToReduce;
                stokMasukStore.put(batch);
              }
            });

            const getProductRequest = productsStore.index('name').get(item.name);
            getProductRequest.onsuccess = (event) => {
              const product = event.target.result;
              if (product) {
                product.stock -= item.quantity;
                productsStore.put(product);
              }
            };
          };
        });

        if (transactionData.paymentMethod === 'cash') {
          cashFlowStore.add({
            type: 'income',
            amount: transactionData.cashAmount,
            description: `Penerimaan Kas - ${transactionData.transactionId}`,
            date: transactionData.date,
            transactionId: transactionData.transactionId,
            paymentMethod: transactionData.paymentMethod,
            timestamp: new Date().getTime()
          });

          if (transactionData.change > 0) {
            cashFlowStore.add({
              type: 'expense',
              amount: transactionData.change,
              description: `Kembalian - ${transactionData.transactionId}`,
              date: transactionData.date,
              transactionId: transactionData.transactionId,
              paymentMethod: transactionData.paymentMethod,
              timestamp: new Date().getTime() + 1
            });
          }
        } else {
          cashFlowStore.add({
            type: 'income',
            amount: transactionData.subtotal,
            description: `Penjualan (${transactionData.paymentMethod.toUpperCase()}) - ${transactionData.transactionId}`,
            date: transactionData.date,
            transactionId: transactionData.transactionId,
            paymentMethod: transactionData.paymentMethod,
            timestamp: new Date().getTime()
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const transactionService = new TransactionService();