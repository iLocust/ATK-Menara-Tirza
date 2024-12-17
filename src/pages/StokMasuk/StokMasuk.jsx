import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockService } from '@/lib/db/StockService';
import { cashFlowService } from '@/lib/db/CashFlowService';
import { AddStockDialog, RestockDialog, UpdatePriceDialog, DeleteDialog } from '@/pages/StokMasuk/StockDialogs';
import { StockTable } from '@/pages/StokMasuk/StockTable';

const StokMasuk = () => {
  const [incomingStock, setIncomingStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdatePriceDialogOpen, setIsUpdatePriceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // New state for barcode handling
  const [useExistingBarcode, setUseExistingBarcode] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [duplicateProduct, setDuplicateProduct] = useState(null);
  const [forceContinue, setForceContinue] = useState(false);
  
  const [formData, setFormData] = useState({
    produk: '',
    kategori: '',
    jumlah: '',
    hargaBeli: '',
    hargaJual: '',
    margin: '',
    barcode: ''
  });

  const [formErrors, setFormErrors] = useState({
    kategori: '',
    produk: '',
    jumlah: '',
    hargaBeli: '',
    hargaJual: '',
    margin: '',
    barcode: ''
  });

  useEffect(() => {
    loadStokMasuk();
  }, []);

  const loadStokMasuk = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await stockService.getAllStokMasuk();
      setIncomingStock(data);
    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeChange = async (value) => {
    setBarcode(value);
    setFormData(prev => ({ ...prev, barcode: value }));
    setForceContinue(false);

    if (value.length >= 8 && value.length <= 13) {
      try {
        const products = await stockService.getAllProductsByBarcode(value);
        if (products.length > 0) {
          setDuplicateProduct(products[0]);
          setError('Barcode sudah digunakan oleh produk lain');
        } else {
          setDuplicateProduct(null);
          setError(null);
        }
      } catch (error) {
        console.error('Error checking barcode:', error);
      }
    } else {
      setDuplicateProduct(null);
      if (value && (value.length < 8 || value.length > 13)) {
        setError('Barcode harus berisi 8-13 digit angka');
      } else {
        setError(null);
      }
    }
  };

  const handleBarcodeConfirm = () => {
    setForceContinue(true);
    setDuplicateProduct(null);
    setError(null);
  };

  const handlePrintBarcode = (barcode) => {
    try {
      const createBarcodeText = () => {
        let output = '';
        output += '\x1B\x40'; // Reset printer
        output += '\x1B\x61\x01'; // Center align
        output += '\x1D\x77\x03'; // Width: 3
        output += '\x1D\x68\x64'; // Height: 100 dots
        output += '\x1D\x6B\x02'; // GS k 2 - EAN13 format
        output += `${barcode}\x00`; // Barcode data with null terminator
        output += '\x1D\x56\x42\x00'; // Cut paper
        return output;
      };

      const printWithRawBT = (text) => {
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
          const S = "#Intent;scheme=rawbt;";
          const P = "package=ru.a402d.rawbtprinter;end;";
          const textEncoded = encodeURI(text);
          window.location.href = "intent:" + textEncoded + S + P;
        } else {
          alert('Printing is only available on Android devices');
        }
      };

      const barcodeText = createBarcodeText();
      printWithRawBT(barcodeText);
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print barcode: ' + error.message);
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.kategori) {
      errors.kategori = 'Kategori harus dipilih';
      isValid = false;
    }

    if (!formData.produk.trim()) {
      errors.produk = 'Nama produk harus diisi';
      isValid = false;
    }

    if (!formData.jumlah || parseInt(formData.jumlah) <= 0) {
      errors.jumlah = 'Jumlah harus lebih dari 0';
      isValid = false;
    }

    if (!formData.hargaBeli || parseInt(formData.hargaBeli) <= 0) {
      errors.hargaBeli = 'Harga beli harus lebih dari 0';
      isValid = false;
    }

    if (!formData.margin || parseFloat(formData.margin) <= 0) {
      errors.margin = 'Margin harus lebih dari 0';
      isValid = false;
    }

    if (!formData.hargaJual || parseInt(formData.hargaJual) <= 0) {
      errors.hargaJual = 'Harga jual harus lebih dari 0';
      isValid = false;
    }

    if (useExistingBarcode) {
      if (!formData.barcode) {
        errors.barcode = 'Barcode harus diisi';
        isValid = false;
      }
      if (!/^\d{8,13}$/.test(formData.barcode)) {
        errors.barcode = 'Barcode harus berisi 8-13 digit angka';
        isValid = false;
      }

      if (duplicateProduct && !forceContinue) {
        errors.barcode = 'Barcode sudah digunakan. Silahkan konfirmasi penggunaan barcode yang sama atau gunakan barcode lain.';
        isValid = false;
      }
    }

    const hargaBeli = parseInt(formData.hargaBeli);
    const hargaJual = parseInt(formData.hargaJual);

    if (hargaJual <= hargaBeli) {
      errors.hargaJual = 'Harga jual harus lebih besar dari harga beli';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      if (field === 'hargaBeli' || field === 'hargaJual') {
        const hargaBeli = parseFloat(field === 'hargaBeli' ? value : prev.hargaBeli) || 0;
        const hargaJual = parseFloat(field === 'hargaJual' ? value : prev.hargaJual) || 0;

        if (hargaBeli > 0 && hargaJual > 0) {
          if (hargaJual > hargaBeli) {
            newData.margin = ((hargaJual - hargaBeli) / hargaBeli * 100).toFixed(2);
          } else {
            newData.margin = '';
          }
        }
      }

      if (field === 'margin') {
        const hargaBeli = parseFloat(prev.hargaBeli) || 0;
        const marginValue = parseFloat(value) || 0;
        if (hargaBeli > 0 && marginValue > 0) {
          const calculatedHargaJual = (hargaBeli * (1 + marginValue / 100)).toFixed(0);
          if (parseInt(calculatedHargaJual) > hargaBeli) {
            newData.hargaJual = calculatedHargaJual;
          }
        }
      }

      return newData;
    });

    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
  
      // Jika ada duplicate dan belum di-confirm, validate form akan menangani error
      if (!validateForm()) {
        return;
      }
  
      const totalCost = parseInt(formData.hargaBeli) * parseInt(formData.jumlah);
      const hasSufficientCash = await cashFlowService.checkCashAvailability(totalCost);
  
      if (!hasSufficientCash) {
        setError('Saldo kas tidak mencukupi untuk pembelian stok ini');
        return;
      }
  
      const newStock = {
        produk: formData.produk,
        kategori: formData.kategori,
        jumlah: parseInt(formData.jumlah),
        hargaBeli: parseInt(formData.hargaBeli),
        hargaJual: parseInt(formData.hargaJual),
        margin: parseFloat(formData.margin),
        tanggalMasuk: new Date().toISOString().split('T')[0],
        sisaStok: parseInt(formData.jumlah),
        barcode: useExistingBarcode ? formData.barcode : stockService.generateBarcode()
      };
  
      await stockService.addStokMasuk(newStock, forceContinue);
      await loadStokMasuk();
  
      // Reset semua state
      setFormData({
        produk: '',
        kategori: '',
        jumlah: '',
        hargaBeli: '',
        hargaJual: '',
        margin: '',
        barcode: ''
      });
      
      setFormErrors({});
      setIsDialogOpen(false);
      setUseExistingBarcode(false);
      setBarcode('');
      setDuplicateProduct(null);
      setForceContinue(false);
  
      setSuccessMessage('Stok berhasil ditambahkan');
      setTimeout(() => setSuccessMessage(null), 3000);
  
    } catch (err) {
      setError('Gagal menambah data: ' + err.message);
    }
  };

  const handleRestock = async () => {
    try {
      setError(null);

      const restockAmount = parseInt(formData.jumlah);
      const totalCost = parseInt(formData.hargaBeli) * restockAmount;
      const hasSufficientCash = await cashFlowService.checkCashAvailability(totalCost);

      if (!hasSufficientCash) {
        setError('Saldo kas tidak mencukupi untuk pembelian stok ini');
        return;
      }

      const updatedProduct = {
        ...selectedProduct,
        jumlah: selectedProduct.jumlah + restockAmount,
        sisaStok: selectedProduct.sisaStok + restockAmount,
        tanggalMasuk: new Date().toISOString().split('T')[0],
        restockAmount: restockAmount
      };

      if (parseInt(formData.hargaBeli) !== selectedProduct.hargaBeli) {
        updatedProduct.hargaBeli = parseInt(formData.hargaBeli);
      }
      if (parseInt(formData.hargaJual) !== selectedProduct.hargaJual) {
        updatedProduct.hargaJual = parseInt(formData.hargaJual);
        updatedProduct.margin = parseFloat(formData.margin);
      }

      await stockService.updateStokMasuk(updatedProduct);
      await loadStokMasuk();

      setIsRestockDialogOpen(false);
      setSelectedProduct(null);
      setFormData({
        produk: '',
        kategori: '',
        jumlah: '',
        hargaBeli: '',
        hargaJual: '',
        margin: ''
      });

      setSuccessMessage('Stok berhasil diperbarui');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      setError('Gagal memperbarui stok: ' + err.message);
    }
  };

  const handleUpdatePrice = async () => {
    try {
      setError(null);
      const updatedProduct = {
        ...selectedProduct,
        hargaJual: parseFloat(formData.hargaJual),
        margin: parseFloat(formData.margin)
      };

      await stockService.updateStokMasuk(updatedProduct);
      await loadStokMasuk();
      setIsUpdatePriceDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError('Gagal mengupdate harga: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      await stockService.deleteStokMasuk(selectedProduct.id);
      await loadStokMasuk();
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      setSuccessMessage('Stok berhasil dihapus dan dana telah direfund');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Gagal menghapus data: ' + err.message);
    }
  };

  const openRestockDialog = (product) => {
    setSelectedProduct(product);
    setFormData({
      produk: product.produk,
      kategori: product.kategori,
      jumlah: '',
      hargaBeli: product.hargaBeli,
      hargaJual: product.hargaJual,
      margin: product.margin
    });
    setIsRestockDialogOpen(true);
  };

  const openUpdatePriceDialog = (product) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      hargaBeli: product.hargaBeli,
      hargaJual: product.hargaJual,
      margin: product.margin
    });
    setIsUpdatePriceDialogOpen(true);
  };

  const openDeleteDialog = (product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return incomingStock;
    
    return [...incomingStock].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stok Masuk</h1>
        <p className="text-gray-600 mt-1">Kelola stok masuk dan atur harga jual produk</p>
      </div>

      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex justify-between items-center">
      <AddStockDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        formErrors={formErrors}
        error={error}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        useExistingBarcode={useExistingBarcode}
        onBarcodeChange={handleBarcodeChange}
        onUseExistingBarcodeChange={setUseExistingBarcode}
        duplicateProduct={duplicateProduct}
        onBarcodeConfirm={handleBarcodeConfirm}
      />

        <Select onValueChange={handleSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urutkan berdasarkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hargaBeli">Harga Beli</SelectItem>
            <SelectItem value="hargaJual">Harga Jual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Daftar Stok Masuk</CardTitle>
          <p className="text-xs text-gray-500">
            Klik ikon printer untuk mencetak barcode
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <StockTable
              stock={getSortedData()}
              onRestock={openRestockDialog}
              onUpdatePrice={openUpdatePriceDialog}
              onDelete={openDeleteDialog}
              onPrintBarcode={handlePrintBarcode}
            />
          </div>
        </CardContent>
      </Card>

      <RestockDialog
        isOpen={isRestockDialogOpen}
        onOpenChange={setIsRestockDialogOpen}
        selectedProduct={selectedProduct}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleRestock}
      />

      <UpdatePriceDialog
        isOpen={isUpdatePriceDialogOpen}
        onOpenChange={setIsUpdatePriceDialogOpen}
        selectedProduct={selectedProduct}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleUpdatePrice}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedProduct={selectedProduct}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default StokMasuk;