import { dbService } from './db-service';
import { cashFlowService } from './CashFlowService';

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
      transaction.oncomplete = async () => {
        try {
          await cashFlowService.updateMonthlyBalance(item.tanggalMasuk);
          resolve('Transaction completed');
        } catch (error) {
          reject('Failed to update monthly balance');
        }
      };
 
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
              paymentMethod: 'cash',
              amount: item.hargaBeli * item.jumlah,
              description: `[Stock Masuk] - ${item.produk} (${item.jumlah} unit)`,
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
    const transaction = dbService.db.transaction(
      ['stokMasuk', 'products', 'cashFlow'],
      'readwrite'
    );
 
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject('Transaction failed');
      transaction.oncomplete = async () => {
        try {
          await cashFlowService.updateMonthlyBalance(item.tanggalMasuk);
          resolve('Transaction completed');
        } catch (error) {
          reject('Failed to update monthly balance');
        }
      };
 
      try {
        const stokMasukStore = transaction.objectStore('stokMasuk');
        const stokRequest = stokMasukStore.put(item);
 
        stokRequest.onsuccess = () => {
          const productsStore = transaction.objectStore('products');
          const getProductRequest = productsStore.index('name').get(item.produk);
 
          getProductRequest.onsuccess = () => {
            const existingProduct = getProductRequest.result;
            const productData = {
              name: item.produk,
              kategori: item.kategori,
              price: item.hargaJual,
              stock: existingProduct ? existingProduct.stock + item.jumlah : item.jumlah
            };
 
            if (existingProduct) {
              productsStore.put({
                ...existingProduct,
                ...productData
              });
            } else {
              productsStore.add(productData);
            }
 
            if (item.restockAmount && item.restockAmount > 0) {
              const cashFlowStore = transaction.objectStore('cashFlow');
              cashFlowStore.add({
                type: 'expense',
                paymentMethod: 'cash',
                amount: item.hargaBeli * item.restockAmount,
                description: `[Restock] - ${item.produk} (${item.restockAmount} unit)`,
                date: item.tanggalMasuk,
                timestamp: new Date().getTime(),
                purchaseId: item.id,
                details: {
                  productName: item.produk,
                  quantity: item.restockAmount,
                  pricePerUnit: item.hargaBeli
                }
              });
            }
          };
        };
      } catch (error) {
        reject(error);
      }
    });
  }
 
  async deleteStokMasuk(id) {
    const item = await dbService.get('stokMasuk', id);
    if (!item) {
      throw new Error('Item not found');
    }
 
    const transaction = dbService.db.transaction(
      ['stokMasuk', 'products'],
      'readwrite'
    );
 
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject('Transaction failed');
      transaction.oncomplete = () => resolve('Transaction completed');
 
      try {
        const stokMasukStore = transaction.objectStore('stokMasuk');
        stokMasukStore.delete(id);
 
        const productsStore = transaction.objectStore('products');
        const getProductRequest = productsStore.index('name').get(item.produk);
 
        getProductRequest.onsuccess = () => {
          const existingProduct = getProductRequest.result;
          if (existingProduct) {
            productsStore.put({
              ...existingProduct,
              stock: Math.max(0, existingProduct.stock - item.jumlah)
            });
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
 
  async getStokMasukByKategori(kategori) {
    return dbService.getAllFromIndex('stokMasuk', 'kategori', kategori);
  }
 
  async getProductStock(productName) {
    const product = await dbService.getFromIndex('products', 'name', productName);
    return product ? product.stock : 0;
  }
 
  async updateProductStock(productName, newStock) {
    const product = await dbService.getFromIndex('products', 'name', productName);
    if (product) {
      await dbService.put('products', {
        ...product,
        stock: Math.max(0, newStock)
      });
    }
  }
 
  async getStokMasukReport(startDate, endDate) {
    const stokMasuk = await this.getAllStokMasuk();
    return stokMasuk.filter(item => {
      const itemDate = new Date(item.tanggalMasuk);
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
  }
 
  async getOutOfStockProducts() {
    const products = await dbService.getAll('products');
    return products.filter(product => product.stock <= 0);
  }
 
  async getLowStockProducts(threshold = 10) {
    const products = await dbService.getAll('products');
    return products.filter(product => product.stock > 0 && product.stock <= threshold);
  }
 }
 
 export const stockService = new StockService();