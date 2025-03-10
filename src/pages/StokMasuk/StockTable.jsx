import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Barcode, Plus, PencilIcon, TrashIcon, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const ActionDialog = ({
  isOpen,
  onClose,
  item,
  onRestock,
  onUpdatePrice,
  onDelete,
  onPrintBarcode,
  onBarcodeUpdate
}) => {
  const [useExistingBarcode, setUseExistingBarcode] = useState(false);
  const [inputBuffer, setInputBuffer] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState(null);
  const [isGeneratedBarcode, setIsGeneratedBarcode] = useState(false);
  const BARCODE_LENGTH = 13;
  const SCAN_TIMEOUT = 100;

  useEffect(() => {
    if (isOpen) {
      // Reset states when dialog opens
      setUseExistingBarcode(false);
      setInputBuffer('');
      setBarcode(item?.barcode || '');
      setError(null);
      setIsGeneratedBarcode(false);
    }
  }, [isOpen, item]);

  useEffect(() => {
    if (!isOpen || !useExistingBarcode) return;

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
            setBarcode(scannedBarcode);
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
  }, [isOpen, useExistingBarcode, inputBuffer, lastScanTime]);

  const handleGenerateBarcode = () => {
    const timestamp = Date.now().toString();
    const newBarcode = timestamp.slice(-13).padStart(13, '0');
    setBarcode(newBarcode);
    setIsGeneratedBarcode(true);
    setUseExistingBarcode(false);
  };

  const handleToggleInput = (checked) => {
    setUseExistingBarcode(checked);
    if (checked) {
      // Clear the generated barcode when switching to manual input
      setBarcode('');
      setIsGeneratedBarcode(false);
    } else {
      // Clear the manual input when unchecking
      setBarcode('');
      setIsGeneratedBarcode(false);
    }
  };

  const handleSaveBarcode = async () => {
    try {
      if (!barcode) {
        setError('Barcode tidak boleh kosong');
        return;
      }

      if (!/^\d{8,13}$/.test(barcode)) {
        setError('Barcode harus berisi 8-13 digit angka');
        return;
      }

      await onBarcodeUpdate(item.id, barcode);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Produk</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {/* Product Info */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-black font-medium text-lg">{item.produk}</h3>
              <p className="text-sm text-gray-500">Kategori: {item.kategori}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Stok Tersedia</p>
                <p className="font-medium text-black">{item.sisaStok} unit</p>
              </div>
              <div>
                <p className="text-gray-500">Harga Beli</p>
                <p className="font-medium text-black">Rp {item.hargaBeli.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Harga Jual</p>
                <p className="font-medium text-black">Rp {item.hargaJual.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Margin</p>
                <p className="font-medium text-black">{item.margin}%</p>
              </div>
            </div>
          </div>

          {/* Barcode Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {item.barcode ? 'Barcode Produk' : 'Barcode belum tersedia'}
              </p>
            </div>
            
            {item.barcode ? (
              <div className="flex flex-col items-center">
                <p className="font-mono text-black text-lg mb-2">{item.barcode}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintBarcode(item.barcode, item.produk)}
                  className="mt-2"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Barcode
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateBarcode}
                    disabled={useExistingBarcode}
                    className="flex items-center"
                  >
                    <Barcode className="h-4 w-4 mr-2" />
                    Generate Barcode Otomatis
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useExistingBarcode"
                      checked={useExistingBarcode}
                      onChange={(e) => handleToggleInput(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useExistingBarcode" className="text-sm text-gray-600 font-medium">
                      Input Manual
                    </label>
                  </div>
                </div>

                {(useExistingBarcode || barcode) && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Scan barcode atau ketik manual"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      readOnly={!useExistingBarcode && isGeneratedBarcode}
                      className="font-mono"
                    />
                    {error && (
                      <p className="text-xs text-red-500">{error}</p>
                    )}
                  </div>
                )}

                {barcode && (
                  <div className="flex flex-col items-center pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveBarcode}
                      className="mt-2"
                    >
                      Simpan Barcode
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => {
                onClose();
                onRestock(item);
              }}
            >
              <div className="bg-blue-50 hover:bg-blue-100 rounded-xl p-4 mb-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md">
                <Plus className="h-7 w-7 text-blue-600" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-gray-700">Tambah Stok</span>
            </div>
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => {
                onClose();
                onUpdatePrice(item);
              }}
            >
              <div className="bg-green-50 hover:bg-green-100 rounded-xl p-4 mb-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md">
                <PencilIcon className="h-7 w-7 text-green-600" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-gray-700">Update Produk</span>
            </div>
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => {
                onClose();
                onDelete(item);
              }}
            >
              <div className="bg-red-50 hover:bg-red-100 rounded-xl p-4 mb-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md">
                <TrashIcon className="h-7 w-7 text-red-600" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-gray-700">Hapus Produk</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const StockTable = ({
  stock,
  onRestock,
  onUpdatePrice,
  onDelete,
  onPrintBarcode,
  onBarcodeUpdate
}) => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium text-gray-900 text-sm py-2">Kategori</TableHead>
            <TableHead className="font-medium text-gray-900 text-sm py-2">Produk</TableHead>
            <TableHead className="font-medium text-gray-900 text-sm py-2">Jumlah</TableHead>
            <TableHead className="font-medium text-gray-900 text-sm py-2">Harga Beli</TableHead>
            <TableHead className="font-medium text-gray-900 text-sm py-2">Harga Jual</TableHead>
            <TableHead className="font-medium text-center text-gray-900 text-sm py-2 w-28">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stock.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-50">
              <TableCell className="text-gray-900 text-sm py-1.5">{item.kategori}</TableCell>
              <TableCell className="text-gray-900 text-sm py-1.5">{item.produk}</TableCell>
              <TableCell className="text-gray-900 text-sm py-1.5">{item.sisaStok}</TableCell>
              <TableCell className="text-gray-900 text-sm py-1.5">Rp {item.hargaBeli.toLocaleString()}</TableCell>
              <TableCell className="text-gray-900 text-sm py-1.5">
                {item.hargaJual ? (
                  `Rp ${item.hargaJual.toLocaleString()}`
                ) : (
                  <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                    Belum diatur
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                  onClick={() => setSelectedItem(item)}
                >
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ActionDialog
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onRestock={onRestock}
        onUpdatePrice={onUpdatePrice}
        onDelete={onDelete}
        onPrintBarcode={onPrintBarcode}
        onBarcodeUpdate={onBarcodeUpdate}
      />
    </>
  );
};