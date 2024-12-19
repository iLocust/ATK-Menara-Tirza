import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockService } from '@/lib/db/StockService';
import ProductList from './ProductList';
import ShoppingCart from './ShoppingCart';
import { AlertCircle } from 'lucide-react';

const Penjualan = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartErrors, setCartErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [inputBuffer, setInputBuffer] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanSuccess, setScanSuccess] = useState(null);

  const BARCODE_LENGTH = 13;
  const SCAN_TIMEOUT = 100;

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleKeyPress = async (event) => {
      const currentTime = new Date().getTime();
      
      if (currentTime - lastScanTime > SCAN_TIMEOUT) {
        setInputBuffer('');
      }
      setLastScanTime(currentTime);

      if (event.key === 'Enter') {
        if (inputBuffer.length > 0) {
          const scannedBarcode = inputBuffer;
          if (scannedBarcode.length === BARCODE_LENGTH) {
            const product = products.find(p => p.barcode === scannedBarcode);
            if (product) {
              await addToCart(product);
              const audio = new Audio('/sounds/beep.mp3');
              await audio.play().catch(e => console.log('Audio play failed:', e));
              setScanSuccess(`${product.name} ditambahkan ke keranjang`);
              setTimeout(() => setScanSuccess(null), 2000);
            }
          }
          setInputBuffer('');
        }
      } else {
        if (/^\d+$/.test(event.key)) {
          setInputBuffer(prev => prev + event.key);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [inputBuffer, lastScanTime, products]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setGlobalError(null);
      const result = await stockService.getAllStokMasuk();
      
      const transformedProducts = result.map(item => ({
        id: item.id,
        name: item.produk,
        price: item.hargaJual,
        stock: item.sisaStok,
        kategori: item.kategori,
        buyPrice: item.hargaBeli,
        barcode: item.barcode
      }));
      
      setProducts(transformedProducts);
    } catch (err) {
      setGlobalError('Gagal memuat data produk: ' + err.message);
      console.error('Load products error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product) => {
    try {
      const currentProducts = await stockService.getAllStokMasuk();
      const currentProduct = currentProducts.find(item => item.id === product.id);
      
      if (!currentProduct) {
        setCartErrors({
          ...cartErrors,
          [product.id]: 'Produk tidak ditemukan'
        });
        return;
      }
  
      const existingItem = cart.find(item => item.id === currentProduct.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      
      if (currentCartQuantity + 1 > currentProduct.sisaStok) {
        setCartErrors({
          ...cartErrors,
          [product.id]: 'Stok produk tidak mencukupi'
        });
        return;
      }
  
      const newErrors = { ...cartErrors };
      delete newErrors[product.id];
      setCartErrors(newErrors);
      
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
          stock: currentProduct.sisaStok,
          barcode: currentProduct.barcode
        }]);
      }
    } catch (err) {
      setCartErrors({
        ...cartErrors,
        [product.id]: 'Gagal menambahkan produk ke keranjang'
      });
      console.error('Add to cart error:', err);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const currentProducts = await stockService.getAllStokMasuk();
      const currentProduct = currentProducts.find(item => item.id === productId);
      
      if (!currentProduct) {
        setCartErrors({
          ...cartErrors,
          [productId]: 'Produk tidak ditemukan'
        });
        return;
      }
  
      if (newQuantity > currentProduct.sisaStok) {
        setCartErrors({
          ...cartErrors,
          [productId]: 'Stok produk tidak mencukupi'
        });
        return;
      }
  
      const newErrors = { ...cartErrors };
      delete newErrors[productId];
      setCartErrors(newErrors);
  
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
      setCartErrors({
        ...cartErrors,
        [productId]: 'Gagal mengupdate kuantitas'
      });
      console.error('Update quantity error:', err);
    }
  };

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
      const currentProducts = await stockService.getAllStokMasuk();
      
      for (const item of cart) {
        const currentProduct = currentProducts.find(p => p.id === item.id);
        if (!currentProduct || currentProduct.sisaStok < item.quantity) {
          setCartErrors({
            ...cartErrors,
            [item.id]: 'Stok produk telah berubah. Mohon periksa kembali.'
          });
          loadProducts();
          return;
        }
      }

      const transactionId = generateTransactionId();
      const transactionData = {
        cart,
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        transactionId,
        date: new Date().toISOString()
      };
      
      navigate('/penjualan/pembayaran', { state: transactionData });
    } catch (err) {
      setGlobalError('Gagal memproses checkout: ' + err.message);
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-2 border-r">
        <ProductList 
          products={products}
          isLoading={isLoading}
          onAddToCart={addToCart}
          scanSuccess={scanSuccess}
        />
      </div>

      <div className="w-1/2 p-2">
        <ShoppingCart 
          cart={cart}
          cartErrors={cartErrors}
          onUpdateQuantity={updateQuantity}
          onCheckout={handleCheckout}
        />
      </div>

      {globalError && (
        <div className="fixed bottom-4 right-4 w-80">
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded shadow">
            <AlertCircle className="h-4 w-4" />
            {globalError}
          </div>
        </div>
      )}
    </div>
  );
};

export default Penjualan;