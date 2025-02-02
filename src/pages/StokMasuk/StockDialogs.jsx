/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusIcon, Upload, Loader2 } from 'lucide-react';
import { importStock } from '../Transactions/excelUtils';

const AddStockDialog = ({
  isOpen,
  onOpenChange,
  formData,
  formErrors,
  error,
  onInputChange,
  onSubmit,
  useExistingBarcode,
  onBarcodeChange,
  onUseExistingBarcodeChange,
  duplicateProduct,
  onBarcodeConfirm
}) => {
  // State for barcode scanning
  const [inputBuffer, setInputBuffer] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const BARCODE_LENGTH = 13;
  const SCAN_TIMEOUT = 100;

  // Handle barcode scanner input
  useEffect(() => {
    if (!useExistingBarcode) return; // Only listen when checkbox is checked

    const handleKeyPress = (event) => {
      const currentTime = new Date().getTime();
      
      if (currentTime - lastScanTime > SCAN_TIMEOUT) {
        setInputBuffer('');
      }
      setLastScanTime(currentTime);

      if (event.key === 'Enter') {
        if (inputBuffer.length > 0) {
          const scannedBarcode = inputBuffer;
          if (scannedBarcode.length === BARCODE_LENGTH) {
            onBarcodeChange(scannedBarcode);
            const audio = new Audio('/sounds/beep.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
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
  }, [useExistingBarcode, inputBuffer, lastScanTime, onBarcodeChange]);

  const handleBarcodeToggle = (checked) => {
    onUseExistingBarcodeChange(checked);
    if (!checked) {
      onBarcodeChange('');
      setInputBuffer('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Tambah Stok Masuk
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Tambah Stok Masuk</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-6">
            {/* Kolom Kiri */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Kategori<span className="text-red-500">*</span></label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => onInputChange('kategori', value)}
                >
                  <SelectTrigger className={formErrors.kategori ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATK">ATK</SelectItem>
                    <SelectItem value="Seragam">Seragam</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.kategori && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.kategori}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Produk<span className="text-red-500">*</span></label>
                <Input
                  placeholder="Masukkan nama produk"
                  value={formData.produk}
                  onChange={(e) => onInputChange('produk', e.target.value)}
                  className={formErrors.produk ? 'border-red-500' : ''}
                />
                {formErrors.produk && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.produk}</p>
                )}
              </div>

              <div className="flex items-center justify-between space-x-2 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useExistingBarcode"
                    checked={useExistingBarcode}
                    onChange={(e) => handleBarcodeToggle(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useExistingBarcode" className="text-sm text-gray-600 font-medium">
                    Gunakan Barcode Produk
                  </label>
                </div>
              </div>

              {useExistingBarcode && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-600 font-medium">Barcode<span className="text-red-500">*</span></label>
                    <Input
                      placeholder="Scan barcode atau ketik manual"
                      value={formData.barcode}
                      onChange={(e) => onBarcodeChange(e.target.value)}
                      className={formErrors.barcode ? 'border-red-500' : ''}
                    />
                    {formErrors.barcode && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.barcode}</p>
                    )}
                  </div>

                  {duplicateProduct && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="font-semibold">Barcode sudah digunakan oleh:</p>
                          <p>Produk: {duplicateProduct.name}</p>
                          <p>Kategori: {duplicateProduct.kategori}</p>
                          <p>Stok: {duplicateProduct.stock}</p>
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              onClick={onBarcodeConfirm}
                              className="bg-white hover:bg-gray-50 text-sm"
                              size="sm"
                            >
                              Lanjutkan dengan barcode yang sama
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>

            {/* Kolom Kanan */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Jumlah<span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah"
                  value={formData.jumlah}
                  onChange={(e) => onInputChange('jumlah', e.target.value)}
                  className={formErrors.jumlah ? 'border-red-500' : ''}
                />
                {formErrors.jumlah && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.jumlah}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Harga Beli<span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  placeholder="Masukkan harga beli"
                  value={formData.hargaBeli}
                  onChange={(e) => onInputChange('hargaBeli', e.target.value)}
                  className={formErrors.hargaBeli ? 'border-red-500' : ''}
                />
                {formErrors.hargaBeli && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.hargaBeli}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Harga Jual<span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  placeholder="Harga jual"
                  value={formData.hargaJual}
                  onChange={(e) => onInputChange('hargaJual', e.target.value)}
                  className={formErrors.hargaJual ? 'border-red-500' : ''}
                />
                {formErrors.hargaJual && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.hargaJual}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Margin (%)<span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  placeholder="Margin"
                  value={formData.margin}
                  onChange={(e) => onInputChange('margin', e.target.value)}
                  className={formErrors.margin ? 'border-red-500' : ''}
                />
                {formErrors.margin && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.margin}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={onSubmit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RestockDialog = ({
  isOpen,
  onOpenChange,
  selectedProduct,
  formData,
  onInputChange,
  onSubmit
}) => {
  if (!selectedProduct) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto top-[32vh]">
        <DialogHeader>
          <DialogTitle>Restock Produk</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 px-6">
          <div className="space-y-2">
            <h3 className="font-medium text-black">{selectedProduct.produk}</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-black">Stok Saat Ini: {selectedProduct.sisaStok}</p>
              <p className="font-medium text-black">Harga Beli: Rp {selectedProduct.hargaBeli.toLocaleString()}</p>
              <p className="font-medium text-black">Harga Jual: Rp {selectedProduct.hargaJual.toLocaleString()}</p>
              <p className="font-medium text-black">Margin: {selectedProduct.margin}%</p>
              <p className="font-medium text-black">Barcode: {selectedProduct.barcode}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">Jumlah Tambahan</label>
            <Input
              type="number"
              value={formData.jumlah}
              onChange={(e) => onInputChange('jumlah', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">Harga Beli Baru (Opsional)</label>
            <Input
              type="number"
              value={formData.hargaBeli}
              onChange={(e) => onInputChange('hargaBeli', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Margin (%) Baru (Opsional)</label>
              <Input
                type="number"
                value={formData.margin}
                onChange={(e) => onInputChange('margin', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Harga Jual Baru (Opsional)</label>
              <Input
                type="number"
                value={formData.hargaJual}
                onChange={(e) => onInputChange('hargaJual', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={onSubmit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UpdatePriceDialog = ({
  isOpen,
  onOpenChange,
  selectedProduct,
  formData,
  formErrors,
  onInputChange,
  onSubmit,
  error
}) => {
  if (!selectedProduct) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Harga Jual & Nama Produk</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 px-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">
                Nama Produk<span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.produk}
                onChange={(e) => onInputChange('produk', e.target.value)}
                className={`font-medium ${formErrors?.produk ? 'border-red-500' : ''}`}
                placeholder="Nama produk"
              />
              {formErrors?.produk && (
                <p className="text-xs text-red-500 mt-1">{formErrors.produk}</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Harga Beli: Rp {selectedProduct.hargaBeli.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Barcode: {selectedProduct.barcode}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">
                Margin (%)<span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.margin}
                onChange={(e) => onInputChange('margin', e.target.value)}
                className={`text-right ${formErrors?.margin ? 'border-red-500' : ''}`}
              />
              {formErrors?.margin && (
                <p className="text-xs text-red-500 mt-1">{formErrors.margin}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">
                Harga Jual<span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.hargaJual}
                onChange={(e) => onInputChange('hargaJual', e.target.value)}
                className={`text-right ${formErrors?.hargaJual ? 'border-red-500' : ''}`}
              />
              {formErrors?.hargaJual && (
                <p className="text-xs text-red-500 mt-1">{formErrors.hargaJual}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={onSubmit}>Simpan Perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteDialog = ({
  isOpen,
  onOpenChange,
  selectedProduct,
  onConfirm
}) => {
  if (!selectedProduct) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Konfirmasi Hapus</DialogTitle>
        </DialogHeader>
        <div className="py-4 px-6">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Apakah Anda yakin ingin menghapus stok masuk untuk produk{' '}
              <span className="font-semibold">{selectedProduct.produk}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-sm text-gray-500">
            <p>Barcode: {selectedProduct.barcode}</p>
            <p>Sisa Stok: {selectedProduct.sisaStok} unit</p>
            <p>Total Refund: Rp {(selectedProduct.hargaBeli * selectedProduct.sisaStok).toLocaleString()}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ImportStockDialog = ({
  isOpen,
  onOpenChange,
  onImportSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx')) {
        setError('Hanya file Excel (.xlsx) yang diperbolehkan');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedFile) {
        setError('Pilih file terlebih dahulu');
        return;
      }

      const importedData = await importStock(selectedFile);
      await onImportSuccess(importedData);
      
      // Reset the form
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedFile(null);
        setError(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Data Stok</DialogTitle>
        </DialogHeader>

        <div className="py-4 px-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2 text-center">
                  Pilih file Excel (.xlsx) atau drag & drop di sini
                </p>
                <p className="text-xs text-gray-500 mb-4 text-center">
                  Pastikan format file sesuai dengan format export
                </p>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  File terpilih: {selectedFile.name}
                </p>
              </div>
            )}

            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium">Petunjuk Import:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gunakan template dari hasil export untuk format yang benar</li>
                <li>Kategori harus 'ATK' atau 'Seragam'</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6">
          <div className="flex justify-end gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedFile(null);
                setError(null);
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengimport...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { AddStockDialog, RestockDialog, UpdatePriceDialog, DeleteDialog, ImportStockDialog };