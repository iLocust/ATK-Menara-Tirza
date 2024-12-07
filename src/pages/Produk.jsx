import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { stockService } from '@/lib/db/StockService';

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stokData = await stockService.getAllStokMasuk();
      
      const transformedProducts = stokData.map(item => ({
        id: item.id,
        name: item.produk,
        category: item.kategori,
        price: item.hargaJual || 0,
        stock: item.sisaStok,
        tanggalMasuk: item.tanggalMasuk
      }));

      const combinedProducts = transformedProducts.reduce((acc, current) => {
        const existing = acc.find(item => 
          item.name === current.name && 
          item.category === current.category
        );

        if (existing) {
          existing.stock += current.stock;
          if (current.price > 0 && current.tanggalMasuk > existing.tanggalMasuk) {
            existing.price = current.price;
          }
        } else {
          acc.push(current);
        }

        return acc;
      }, []);

      setProducts(combinedProducts);
    } catch (err) {
      setError('Gagal memuat data produk: ' + err.message);
      console.error('Load products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Memuat katalog produk...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Katalog Produk Koperasi</h1>
        <p className="text-gray-600 mt-1">Temukan berbagai kebutuhan sekolah Anda di sini</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Pilih Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="ATK">ATK</SelectItem>
            <SelectItem value="Seragam">Seragam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className="flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-center gap-4">
              <div>
                <div className="font-medium text-black">{product.name}</div>
                <div className="text-sm text-gray-500">
                  Stok: {product.stock} unit
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white">
              <Badge variant="secondary">{product.category}</Badge>
              {product.price > 0 ? (
                <div className="font-semibold text-right text-black">
                  Rp {product.price.toLocaleString()}
                </div>
              ) : (
                <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                  Harga belum tersedia
                </Badge>
              )}
              <Badge 
                variant={product.stock > 0 ? "success" : "destructive"}
                className={`${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {product.stock > 0 ? 'Tersedia' : 'Habis'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada produk yang ditemukan</p>
          <p className="text-sm text-gray-400 mt-2">
            Coba cari dengan kata kunci lain atau pilih kategori yang berbeda
          </p>
        </div>
      )}
    </div>
  );
};

export default Products;