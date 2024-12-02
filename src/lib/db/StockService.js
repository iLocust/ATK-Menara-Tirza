import { dbService } from './db-service';

class StockService {
  async getAllStokMasuk() {
    return dbService.getAll('stokMasuk');
  }

  async addStokMasuk(item) {
    const transaction = dbService.db.transaction(
      ['stokMasuk', 'products', 'cashFlow'],
      'readwrite'
    );

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject('Transaction failed');
      transaction.oncomplete = () => resolve('Transaction completed');

      try {
        const stokMasukStore = transaction.objectStore('stokMasuk');
        const stokRequest = stokMasukStore.add({
          ...item,
          sisaStok: item.jumlah
        });

        stokRequest.onsuccess = () => {
          const productsStore = transaction.objectStore('products');
          const getProductRequest = productsStore.index('name').get(item.produk);

          getProductRequest.onsuccess = () => {
            const existingProduct = getProductRequest.result;
            const productData = {
              name: item.produk,
              kategori: item.kategori,
              price: item.hargaJual,
              stock: existingProduct ? existingProduct.stock + item.jumlah : item.jumlah,
              latestBatch: item.batchNumber
            };

            if (existingProduct) {
              productsStore.put({
                ...existingProduct,
                ...productData
              });
            } else {
              productsStore.add(productData);
            }

            const cashFlowStore = transaction.objectStore('cashFlow');
            cashFlowStore.add({
              type: 'expense',
              paymentMethod: 'cash', // Tambahkan ini
              amount: item.hargaBeli * item.jumlah,
              description: `Pembelian Stok - ${item.produk} (${item.jumlah} unit)`,
              date: item.tanggalMasuk,
              timestamp: new Date().getTime(),
              purchaseId: stokRequest.result,
              details: {
                productName: item.produk,
                quantity: item.jumlah,
                pricePerUnit: item.hargaBeli,
                batchNumber: item.batchNumber
              }
            });
          };
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async updateStokMasuk(item) {
    await dbService.put('stokMasuk', item);
    await this.updateProductFromStok(item);
    return item.id;
  }

  async deleteStokMasuk(id) {
    return dbService.delete('stokMasuk', id);
  }

  async getStokMasukByKategori(kategori) {
    return dbService.getAllFromIndex('stokMasuk', 'kategori', kategori);
  }

  async updateProductFromStok(stokItem) {
    const products = await dbService.getAll('products');
    const existingProduct = products.find(p => p.name === stokItem.produk);

    const productData = {
      name: stokItem.produk,
      kategori: stokItem.kategori,
      price: stokItem.hargaJual,
      stock: stokItem.jumlah
    };

    if (existingProduct) {
      await dbService.put('products', {
        ...existingProduct,
        ...productData,
        stock: existingProduct.stock + stokItem.jumlah
      });
    } else {
      await dbService.add('products', productData);
    }
  }
}

export const stockService = new StockService();