import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProductList = ({ products, isLoading, onAddToCart, scanSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const filterProducts = () => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.price &&
      (selectedCategory === 'all' || product.kategori === selectedCategory)
    );
    setFilteredProducts(filtered);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat data produk...</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle>Daftar Produk</CardTitle>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="ATK">ATK</SelectItem>
              <SelectItem value="Seragam">Seragam</SelectItem>
            </SelectContent>
          </Select>
          {scanSuccess && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{scanSuccess}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-2 pt-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="hover:bg-gray-50 transition-colors"
            >
              <CardContent className="pt-4 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-medium text-lg">{product.name}</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${
                      product.stock === 0 ? 'text-red-600 font-semibold' :
                      product.stock < 5 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      Stok: {product.stock}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      Rp {product.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={product.stock < 1}
                  className="hover:bg-green-50 hover:text-green-600"
                  onClick={() => product.stock > 0 && onAddToCart(product)}
                >
                  + Tambah
                </Button>
              </CardContent>
            </Card>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <p>Tidak ada produk yang sesuai dengan pencarian</p>
              ) : (
                <p>Belum ada produk yang tersedia</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductList;