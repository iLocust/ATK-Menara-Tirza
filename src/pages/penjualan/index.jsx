import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const Penjualan = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample products data - ganti dengan data dari backend
  const products = [
    { id: 1, name: 'Buku Tulis', price: 5000, stock: 100 },
    { id: 2, name: 'Pulpen', price: 3500, stock: 150 },
    { id: 3, name: 'Pensil', price: 2000, stock: 200 },
    { id: 4, name: 'Penghapus', price: 1500, stock: 120 },
    { id: 5, name: 'Penggaris', price: 4000, stock: 80 },
  ];

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    navigate('/penjualan/pembayaran', { 
      state: { cart, subtotal } 
    });
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Product List */}
      <Card className="h-[calc(100vh-6rem)] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>Daftar Produk</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">{product.name}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        Stok: {product.stock}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        Rp {product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:bg-green-50 hover:text-green-600"
                  >
                    + Tambah
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shopping Cart */}
      <Card className="h-[calc(100vh-6rem)] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>Keranjang Belanja</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-green-600">Rp {item.price.toLocaleString()}</p>
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
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}

            {cart.length > 0 ? (
              <div className="space-y-4 sticky bottom-0 bg-white pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Subtotal:</span>
                  <span className="text-green-600">Rp {subtotal.toLocaleString()}</span>
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  Bayar Sekarang
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
  );
};

export default Penjualan;