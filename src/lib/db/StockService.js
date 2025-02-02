/* eslint-disable no-useless-catch */
import { dbService } from './db-service';
import { cashFlowService } from './CashFlowService';

class StockService {
  async getAllStokMasuk() {
    return dbService.getAll('stokMasuk');
  }

  generateBarcode() {
    // Generate random 13 digit EAN-13 barcode
    const prefix = '200'; // Custom prefix for internal products
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const digits = prefix + random;
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return digits + checkDigit;
  }

  async getProductByBarcode(barcode) {
    try {
      return await dbService.getFromIndex('products', 'barcode', barcode);
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      throw error;
    }
  }

  async validateBarcode(barcode) {
    // Check if barcode format is valid (8-13 digits)
    if (!/^\d{8,13}$/.test(barcode)) {
      throw new Error('Barcode harus berisi 8-13 digit angka');
    }
    return true;
  }

  async updateBarcode(productId, newBarcode) {
    try {
      // Validate the new barcode
      await this.validateBarcode(newBarcode);
  
      // Check if barcode is already in use (unless it's empty)
      if (newBarcode) {
        const existingProducts = await this.getAllProductsByBarcode(newBarcode);
        const isUsedByDifferentProduct = existingProducts.length > 0 && 
          existingProducts[0].id !== productId;
        
        if (isUsedByDifferentProduct) {
          throw new Error('Barcode sudah digunakan oleh produk lain');
        }
      }
  
      const transaction = dbService.db.transaction(
        ['stokMasuk', 'products'],
        'readwrite'
      );
  
      return new Promise((resolve, reject) => {
        transaction.onerror = () => reject(new Error('Gagal menyimpan barcode'));
        transaction.oncomplete = () => resolve('Barcode berhasil diperbarui');
  
        try {
          // Update in stokMasuk store
          const stokMasukStore = transaction.objectStore('stokMasuk');
          const getStokRequest = stokMasukStore.get(productId);
  
          getStokRequest.onsuccess = () => {
            const stok = getStokRequest.result;
            if (stok) {
              stok.barcode = newBarcode;
              stokMasukStore.put(stok);
  
              // Update in products store
              const productsStore = transaction.objectStore('products');
              const getProductRequest = productsStore.index('name').get(stok.produk);
  
              getProductRequest.onsuccess = () => {
                const product = getProductRequest.result;
                if (product) {
                  product.barcode = newBarcode;
                  productsStore.put(product);
                }
              };
            } else {
              reject(new Error('Produk tidak ditemukan'));
            }
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async getAllProductsByBarcode(barcode) {
    try {
      const products = await dbService.getAllFromIndex('products', 'barcode', barcode);
      return products;
    } catch (error) {
      console.error('Error getting products by barcode:', error);
      throw error;
    }
  }
 
  async addStokMasuk(item, forceContinue = false) {
    if (!forceContinue) {
      try {
        await this.validateBarcode(item.barcode);
      } catch (error) {
        throw error;
      }
    }

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
              latestBatch: item.batchNumber,
              barcode: item.barcode
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
                batchNumber: item.batchNumber,
                barcode: item.barcode
              }
            });
          };
        };
      } catch (error) {
        reject(error);
      }
    });
  }
 
  async addImportedStock(stockItem) {
    try {
      const transaction = dbService.db.transaction(
        ['stokMasuk', 'products', 'cashFlow'],
        'readwrite'
      );
  
      return new Promise((resolve, reject) => {
        transaction.onerror = () => reject('Transaction failed');
        transaction.oncomplete = async () => {
          try {
            await cashFlowService.updateMonthlyBalance(stockItem.tanggalMasuk);
            resolve('Transaction completed');
          } catch (error) {
            reject('Failed to update monthly balance');
          }
        };
  
        try {
          // Add to stokMasuk store
          const stokMasukStore = transaction.objectStore('stokMasuk');
          const stokRequest = stokMasukStore.add({
            ...stockItem,
            sisaStok: stockItem.sisaStok,
            jumlah: stockItem.sisaStok // Set initial jumlah same as sisaStok for imports
          });
  
          stokRequest.onsuccess = () => {
            // Update or create product record
            const productsStore = transaction.objectStore('products');
            const getProductRequest = productsStore.index('name').get(stockItem.produk);
  
            getProductRequest.onsuccess = () => {
              const existingProduct = getProductRequest.result;
              const productData = {
                name: stockItem.produk,
                kategori: stockItem.kategori,
                stock: stockItem.sisaStok + (existingProduct ? existingProduct.stock : 0),
                price: stockItem.hargaJual,
                barcode: stockItem.barcode
              };
  
              if (existingProduct) {
                productsStore.put({
                  ...existingProduct,
                  ...productData
                });
              } else {
                productsStore.add(productData);
              }
  
              // Add cash flow record for the imported stock
              const cashFlowStore = transaction.objectStore('cashFlow');
              cashFlowStore.add({
                type: 'expense',
                paymentMethod: 'cash',
                amount: stockItem.hargaBeli * stockItem.sisaStok,
                description: `[Stock Import] - ${stockItem.produk} (${stockItem.sisaStok} unit)`,
                date: stockItem.tanggalMasuk,
                timestamp: new Date().getTime(),
                purchaseId: stokRequest.result,
                details: {
                  productName: stockItem.produk,
                  quantity: stockItem.sisaStok,
                  pricePerUnit: stockItem.hargaBeli,
                  barcode: stockItem.barcode
                }
              });
            };
          };
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Gagal menambahkan stok: ${error.message}`);
    }
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
      const productsStore = transaction.objectStore('products');

      // First get the existing product to check if name changed
      const getOldProductRequest = productsStore.index('name').get(item.oldProduk || item.produk);

      getOldProductRequest.onsuccess = () => {
        const existingProduct = getOldProductRequest.result;
        
        // Update stokMasuk record
        const stokRequest = stokMasukStore.put(item);

        stokRequest.onsuccess = () => {
          if (existingProduct) {
            // If name changed, create new product record and delete old one
            if (item.oldProduk && item.oldProduk !== item.produk) {
              productsStore.delete(existingProduct.id);
              
              const productData = {
                name: item.produk,
                kategori: item.kategori,
                price: item.hargaJual,
                stock: existingProduct.stock,
                barcode: item.barcode
              };
              
              productsStore.add(productData);
            } else {
              // Just update existing product
              productsStore.put({
                ...existingProduct,
                name: item.produk,
                price: item.hargaJual
              });
            }
          }

          // Handle restock if needed
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
                pricePerUnit: item.hargaBeli,
                barcode: item.barcode
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
      ['stokMasuk', 'products', 'cashFlow'],
      'readwrite'
    );
  
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject('Transaction failed');
      transaction.oncomplete = async () => {
        try {
          await cashFlowService.updateMonthlyBalance(new Date().toISOString().split('T')[0]);
          resolve('Transaction completed');
        } catch (error) {
          reject('Failed to update monthly balance');
        }
      };
  
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
              stock: Math.max(0, existingProduct.stock - item.sisaStok)
            });
          }
  
          // Calculate refund amount based on remaining stock
          const refundAmount = item.sisaStok * item.hargaBeli;
  
          const cashFlowStore = transaction.objectStore('cashFlow');
          cashFlowStore.add({
            type: 'income',
            paymentMethod: 'cash',
            amount: refundAmount,
            description: `[Refund Stok] - ${item.produk} (${item.sisaStok} unit)`,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().getTime(),
            refundId: id,
            details: {
              productName: item.produk,
              remainingQuantity: item.sisaStok,
              originalQuantity: item.jumlah,
              pricePerUnit: item.hargaBeli,
              originalPurchaseDate: item.tanggalMasuk,
              barcode: item.barcode
            }
          });
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

  async updateBarcodeForProduct(productId, newBarcode) {
    const transaction = dbService.db.transaction(
      ['stokMasuk', 'products'],
      'readwrite'
    );

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject('Transaction failed');
      transaction.oncomplete = () => resolve('Transaction completed');

      try {
        // Update in products store
        const productsStore = transaction.objectStore('products');
        const getProductRequest = productsStore.get(productId);

        getProductRequest.onsuccess = () => {
          const product = getProductRequest.result;
          if (product) {
            product.barcode = newBarcode;
            productsStore.put(product);

            // Update in stokMasuk store
            const stokMasukStore = transaction.objectStore('stokMasuk');
            const getStokRequest = stokMasukStore.get(productId);

            getStokRequest.onsuccess = () => {
              const stok = getStokRequest.result;
              if (stok) {
                stok.barcode = newBarcode;
                stokMasukStore.put(stok);
              }
            };
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}
 
export const stockService = new StockService();