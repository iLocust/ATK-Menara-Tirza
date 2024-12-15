import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle, Barcode,Camera, SwitchCamera, StopCircle } from 'lucide-react';
import { stockService } from '@/lib/db/StockService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import JsBarcode from 'jsbarcode';
import { BrowserMultiFormatReader } from '@zxing/library';



const Penjualan = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartErrors, setCartErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);
  const [scanError, setScanError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  const BARCODE_LENGTH = 13;
  const SCAN_TIMEOUT = 500;

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    if (isScannerOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isScannerOpen]);

  useEffect(() => {
    if (!isScannerOpen) {
      stopScanning();
    } else {
      getCameras();
    }
    return () => {
      stopScanning();
    };
  }, [isScannerOpen]);

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

  const filterProducts = () => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      product.price &&
      (selectedCategory === 'all' || product.kategori === selectedCategory)
    );
    setFilteredProducts(filtered);
  };

  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // Try to find and select rear camera by default
      const rearCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      setSelectedCamera(rearCamera?.deviceId || videoDevices[0]?.deviceId);
    } catch (err) {
      console.error('Error accessing cameras:', err);
      setScanError('Tidak dapat mengakses kamera');
    }
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setScanError(null);
      
      if (!selectedCamera) {
        setScanError('Tidak ada kamera yang dipilih');
        return;
      }

      const constraints = {
        video: {
          deviceId: selectedCamera,
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      await codeReader.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const barcode = result.getText();
            if (barcode.length === BARCODE_LENGTH) {
              // Play success sound
              const audio = new Audio('/sounds/beep.mp3');
              await audio.play().catch(e => console.log('Audio play failed:', e));
              
              // Process the scanned barcode
              setBarcodeInput(barcode);
              await handleBarcodeSubmit();
            }
          }
          if (err && err.name !== 'NotFoundException') {
            console.error('Scanning error:', err);
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setScanError('Gagal memulai scanner: ' + err.message);
    }
  };

  const stopScanning = async () => {
    try {
      await codeReader.current.reset();
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleCameraSwitch = async (deviceId) => {
    await stopScanning();
    setSelectedCamera(deviceId);
    startScanning();
  };

  const handleBarcodeSubmit = async () => {
    try {
      setScanError(null);
      if (barcodeInput.length !== BARCODE_LENGTH) {
        setScanError('Barcode harus 13 digit');
        return;
      }

      const product = products.find(p => p.barcode === barcodeInput);
      if (!product) {
        setScanError('Produk tidak ditemukan');
        return;
      }

      await addToCart(product);
      setScanSuccess(`${product.name} ditambahkan ke keranjang`);
      setBarcodeInput('');
      setTimeout(() => setScanSuccess(null), 2000);
      
    } catch (error) {
      setScanError(error.message);
    }
  };

  const handleBarcodeKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleBarcodeSubmit();
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

      // Play success sound
      const audio = new Audio('/sounds/beep.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));

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
        subtotal,
        transactionId,
        date: new Date().toISOString()
      };
      
      navigate('/penjualan/pembayaran', { state: transactionData });
    } catch (err) {
      setGlobalError('Gagal memproses checkout: ' + err.message);
      console.error('Checkout error:', err);
    }
  };

  const renderScannerDialog = () => (
    <Dialog open={isScannerOpen} onOpenChange={(open) => {
      setIsScannerOpen(open);
      if (!open) stopScanning();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>
        <div className="py-4 px-6">
          <div className="space-y-4">
            {scanError && (
              <Alert variant="destructive">
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}
            
            {scanSuccess && (
              <Alert className="bg-green-50 text-green-700 border-green-200">
                <AlertDescription>{scanSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {availableCameras.length > 1 && (
                <Select value={selectedCamera} onValueChange={handleCameraSwitch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kamera" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCameras.map((camera) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Kamera ${camera.deviceId.slice(0, 5)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex justify-center gap-2">
                {!isScanning ? (
                  <Button onClick={startScanning} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Mulai Scan
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex items-center gap-2">
                    <StopCircle className="h-4 w-4" />
                    Hentikan Scan
                  </Button>
                )}
              </div>

              <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-white/50 pointer-events-none">
                  <div className="absolute inset-x-[20%] inset-y-[30%] border-2 border-green-400/50">
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Atau masukkan barcode manual
                </label>
                <div className="flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
                      setBarcodeInput(value);
                      setScanError(null);
                    }}
                    onKeyPress={handleBarcodeKeyPress}
                    placeholder="13 digit barcode"
                    className="font-mono text-lg"
                    autoComplete="off"
                  />
                  <Button
                    onClick={handleBarcodeSubmit}
                    disabled={barcodeInput.length !== BARCODE_LENGTH}
                  >
                    Tambah
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Barcode className="h-4 w-4" />
                  Scan Barcode
                </Button>
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
                      {product.barcode && (
                        <div className="mt-2">
                          <svg ref={(ref) => {
                            if (ref) {
                              try {
                                JsBarcode(ref, product.barcode, {
                                  format: "EAN13",
                                  width: 1.5,
                                  height: 30,
                                  displayValue: true,
                                  fontSize: 10,
                                  margin: 0
                                });
                              } catch (err) {
                                console.error('Error generating barcode:', err);
                              }
                            }
                          }} />
                        </div>
                      )}
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
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-green-600">
                        Rp {item.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Subtotal: Rp {(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.barcode && (
                        <div className="mt-1">
                          <svg ref={(ref) => {
                            if (ref) {
                              try {
                                JsBarcode(ref, item.barcode, {
                                  format: "EAN13",
                                  width: 1,
                                  height: 25,
                                  displayValue: true,
                                  fontSize: 8,
                                  margin: 0
                                });
                              } catch (err) {
                                console.error('Error generating barcode:', err);
                              }
                            }
                          }} />
                        </div>
                      )}
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
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {cartErrors[item.id] && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      {cartErrors[item.id]}
                    </div>
                  )}
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

      {renderScannerDialog()}

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