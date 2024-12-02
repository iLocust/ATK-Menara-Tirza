import { dbService } from './db-service';

class ProductService {
  async getAllProducts() {
    return dbService.getAll('products');
  }

  async updateProductStock(productId, quantity) {
    const product = await dbService.get('products', productId);
    if (product) {
      product.stock -= quantity;
      await dbService.put('products', product);
    }
  }

  async getProduct(productId) {
    return dbService.get('products', productId);
  }

  async updateProduct(product) {
    return dbService.put('products', product);
  }

  async deleteProduct(productId) {
    return dbService.delete('products', productId);
  }

  async getProductsByCategory(category) {
    return dbService.getAllFromIndex('products', 'kategori', category);
  }
}

export const productService = new ProductService();