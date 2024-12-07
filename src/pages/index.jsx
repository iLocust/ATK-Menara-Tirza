import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { stockService } from '@/lib/db/StockService';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const Penjualan = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Load products from IndexedDB
  useEffect(() => {
    loadProducts();
  }, []);

  // Update filtered products whenever products or search term changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await stockService.getAllStokMasuk();
      
      const transformedProducts = result.map(item => ({
        id: item.id,
        name: item.produk,
        price: item.hargaJual,
        stock: item.sisaStok,
        kategori: item.kategori,
        buyPrice: item.hargaBeli
      }));
      
      setProducts(transformedProducts);
    } catch (err) {
      setError('Gagal memuat data produk: ' + err.message);
      console.error('Load products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.price &&
      (selectedCategory === 'all' || product.kategori === selectedCategory)
    );
    setFilteredProducts(filtered);
  };

  const addToCart = async (product) => {
    try {
      // Get latest product data to ensure stock accuracy
      const currentProducts = await stockService.getAllStokMasuk();
      const currentProduct = currentProducts.find(item => item.id === product.id);
      
      if (!currentProduct) {
        setError('Produk tidak ditemukan');
        return;
      }
  
      // Check if product has enough stock using sisaStok
      const existingItem = cart.find(item => item.id === currentProduct.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      
      if (currentCartQuantity + 1 > currentProduct.sisaStok) {
        setError('Stok produk tidak mencukupi');
        return;
      }
  
      setError(null);
      
      if (existingItem) {
        setCart(cart.map(item =>
          item.id === currentProduct.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, { 
          id: currentProduct.id, 
          name: currentProduct.produk, 
          price: currentProduct.hargaJual,
          quantity: 1,
          stock: currentProduct.sisaStok // Changed from jumlah to sisaStok
        }]);
      }
    } catch (err) {
      setError('Gagal menambahkan produk ke keranjang: ' + err.message);
      console.error('Add to cart error:', err);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const currentProducts = await stockService.getAllStokMasuk();
      const currentProduct = currentProducts.find(item => item.id === productId);
      
      if (!currentProduct) {
        setError('Produk tidak ditemukan');
        return;
      }
  
      // Check if new quantity exceeds available stock using sisaStok
      if (newQuantity > currentProduct.sisaStok) {
        setError('Stok produk tidak mencukupi');
        return;
      }
  
      setError(null);
  
      if (newQuantity < 1) {
        setCart(cart.filter(item => item.id !== productId));
      } else {
        setCart(cart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }
    } catch (err) {
      setError('Gagal mengupdate kuantitas: ' + err.message);
      console.error('Update quantity error:', err);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const generateTransactionId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TRX${year}${month}${day}${random}`;
  };

  const handleCheckout = async () => {
    try {
      // Verify stock availability one last time before checkout
      const currentProducts = await stockService.getAllStokMasuk();
      
      for (const item of cart) {
        const currentProduct = currentProducts.find(p => p.id === item.id);
        if (!currentProduct || currentProduct.jumlah < item.quantity) {
          setError('Stok produk telah berubah. Mohon periksa kembali keranjang Anda.');
          loadProducts(); // Reload products to show current stock
          return;
        }
      }

      const transactionId = generateTransactionId();

      // Create transaction data
      const transactionData = {
        cart,
        subtotal,
        transactionId, // Include the transaction ID
        date: new Date().toISOString()
      };
      
      navigate('/penjualan/pembayaran', { 
        state: transactionData
      });
    } catch (err) {
      setError('Gagal memproses checkout: ' + err.message);
      console.error('Checkout error:', err);
    }
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
    <div className="flex h-screen">
    <div className="flex-1 p-2 border-r">
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
                    onClick={() => product.stock > 0 && addToCart(product)}
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
    </div>

    <div className="w-1/2 p-2">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>Keranjang Belanja</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
    <div className="space-y-4 pt-2">
      {cart.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-green-600">
              Rp {item.price.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              Subtotal: Rp {(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              -
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.stock} // Disable if quantity reaches stock limit
            >
              +
            </Button>
          </div>
        </div>
      ))}

      {cart.length > 0 ? (
        <div className="space-y-4 sticky bottom-0 bg-white pt-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-green-600">
              Rp {subtotal.toLocaleString()}
            </span>
          </div>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            size="lg"
            onClick={handleCheckout}
          >
            Bayar Sekarang ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
          </Button>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-center text-gray-500">Keranjang kosong</p>
        </div>
      )}
    </div>
  </CardContent>
      </Card>
    </div>

    {error && (
  <div className="fixed top-4 right-4 w-80">
    <Alert className="bg-red-50 border-red-100">
      <AlertDescription className="text-red-800">
        {error}
      </AlertDescription>
    </Alert>
  </div>
)}
  </div>
);
};

export default Penjualan;