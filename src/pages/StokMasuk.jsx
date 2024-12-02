import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, RefreshCwIcon } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { stockService } from '@/lib/db/StockService';
import { cashFlowService } from '@/lib/db/CashFlowService';

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
  const [formData, setFormData] = useState({
    produk: '',
    kategori: '',
    jumlah: '',
    hargaBeli: '',
    hargaJual: '',
    margin: ''
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

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'hargaBeli' || field === 'hargaJual') {
        const hargaBeli = parseFloat(field === 'hargaBeli' ? value : prev.hargaBeli) || 0;
        const hargaJual = parseFloat(field === 'hargaJual' ? value : prev.hargaJual) || 0;
        
        if (hargaBeli > 0 && hargaJual > 0) {
          newData.margin = ((hargaJual - hargaBeli) / hargaBeli * 100).toFixed(2);
        }
      }
      
      if (field === 'margin') {
        const hargaBeli = parseFloat(prev.hargaBeli) || 0;
        const marginValue = parseFloat(value) || 0;
        if (hargaBeli > 0) {
          newData.hargaJual = (hargaBeli * (1 + marginValue / 100)).toFixed(0);
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
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
        hargaJual: parseInt(formData.hargaJual) || null,
        margin: parseFloat(formData.margin) || null,
        tanggalMasuk: new Date().toISOString().split('T')[0],
        sisaStok: parseInt(formData.jumlah)
      };

      await stockService.addStokMasuk(newStock);
      await loadStokMasuk();
      
      setFormData({
        produk: '',
        kategori: '',
        jumlah: '',
        hargaBeli: '',
        hargaJual: '',
        margin: ''
      });
      setIsDialogOpen(false);
      
      setSuccessMessage('Stok berhasil ditambahkan');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      setError('Gagal menambah data: ' + err.message);
    }
  };

  const handleRestock = async () => {
    try {
      setError(null);
      
      const totalCost = parseInt(formData.hargaBeli) * parseInt(formData.jumlah);
      const hasSufficientCash = await cashFlowService.checkCashAvailability(totalCost);
      
      if (!hasSufficientCash) {
        setError('Saldo kas tidak mencukupi untuk pembelian stok ini');
        return;
      }
  
      const updatedProduct = {
        ...selectedProduct,
        jumlah: selectedProduct.jumlah + parseInt(formData.jumlah),
        sisaStok: selectedProduct.sisaStok + parseInt(formData.jumlah),
        tanggalMasuk: new Date().toISOString().split('T')[0]
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
      console.error(err);
    }
  };
  const handleDelete = async () => {
    try {
      setError(null);
      await stockService.deleteStokMasuk(selectedProduct.id);
      await loadStokMasuk();
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError('Gagal menghapus data: ' + err.message);
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Memuat data...</div>
        </div>
      </div>
    );
  }

  const sortedStock = getSortedData();
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex justify-between items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Tambah Stok Masuk
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Stok Masuk</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 px-6">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Kategori</label>
                <Select 
                  value={formData.kategori}
                  onValueChange={(value) => handleInputChange('kategori', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATK">ATK</SelectItem>
                    <SelectItem value="Seragam">Seragam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Produk</label>
                <Input 
                  placeholder="Masukkan nama produk"
                  value={formData.produk}
                  onChange={(e) => handleInputChange('produk', e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Jumlah</label>
                <Input 
                  type="number"
                  placeholder="Masukkan jumlah"
                  value={formData.jumlah}
                  onChange={(e) => handleInputChange('jumlah', e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm text-gray-600 font-medium">Harga Beli</label>
                <Input 
                  type="number"
                  placeholder="Masukkan harga beli"
                  value={formData.hargaBeli}
                  onChange={(e) => handleInputChange('hargaBeli', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-600 font-medium">Margin (%)</label>
                  <Input
                    type="number"
                    placeholder="Margin"
                    value={formData.margin}
                    onChange={(e) => handleInputChange('margin', e.target.value)}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-600 font-medium">Harga Jual</label>
                  <Input
                    type="number"
                    placeholder="Harga jual"
                    value={formData.hargaJual}
                    onChange={(e) => handleInputChange('hargaJual', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSubmit}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Select onValueChange={handleSort}>
        <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urutkan berdasarkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tanggalMasuk">Tanggal</SelectItem>
            <SelectItem value="hargaBeli">Harga Beli</SelectItem>
            <SelectItem value="hargaJual">Harga Jual</SelectItem>
            <SelectItem value="margin">Margin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Daftar Stok Masuk</CardTitle>
          <p className="text-sm text-gray-500">
            Klik ikon pensil untuk mengatur harga jual
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
      <TableRow>
        <TableHead className="font-semibold text-gray-900">Tanggal</TableHead>
        <TableHead className="font-semibold text-gray-900">Kategori</TableHead>
        <TableHead className="font-semibold text-gray-900">Produk</TableHead>
        <TableHead className="font-semibold text-gray-900">Jumlah</TableHead>
        <TableHead className="font-semibold text-gray-900">Sisa</TableHead>
        <TableHead className="font-semibold text-gray-900">Harga Beli</TableHead>
        <TableHead className="font-semibold text-gray-900">Harga Jual</TableHead>
        <TableHead className="font-semibold text-gray-900">Margin</TableHead>
        <TableHead className="font-semibold text-gray-900">Aksi</TableHead>
      </TableRow>
    </TableHeader>
              <TableBody>
                {sortedStock.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-900">{item.tanggalMasuk}</TableCell>
                    <TableCell className="text-gray-900">{item.kategori}</TableCell>
                    <TableCell className="text-gray-900">{item.produk}</TableCell>
                    <TableCell className="text-gray-900">{item.jumlah}</TableCell>
                    <TableCell className="text-gray-900">{item.sisaStok}</TableCell>
                    <TableCell className="text-gray-900">Rp {item.hargaBeli.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-900">
                      {item.hargaJual ? (
                        `Rp ${item.hargaJual.toLocaleString()}`
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                          Belum diatur
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {item.margin ? `${item.margin}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRestockDialog(item)}
                          className="hover:bg-blue-100 text-blue-600"
                        >
                          <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUpdatePriceDialog(item)}
                          className="hover:bg-gray-100"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(item)}
                          className="hover:bg-red-100 text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Restock Produk</DialogTitle>
    </DialogHeader>
    
    {selectedProduct && (
      <div className="grid gap-4 py-4 px-6">
        <div className="space-y-2">
          <h3 className="font-medium text-black">{selectedProduct.produk}</h3>
          <div className="text-sm space-y-1">
            <p className="font-medium text-black">Stok Saat Ini: {selectedProduct.sisaStok}</p>
            <p className="font-medium text-black">Harga Beli: Rp {selectedProduct.hargaBeli.toLocaleString()}</p>
            <p className="font-medium text-black">Harga Jual: Rp {selectedProduct.hargaJual.toLocaleString()}</p>
            <p className="font-medium text-black">Margin: {selectedProduct.margin}%</p>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm text-gray-600 font-medium">Jumlah Tambahan</label>
          <Input 
            type="number"
            value={formData.jumlah}
            onChange={(e) => handleInputChange('jumlah', e.target.value)}
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm text-gray-600 font-medium">Harga Beli Baru (Opsional)</label>
          <Input 
            type="number"
            value={formData.hargaBeli}
            onChange={(e) => handleInputChange('hargaBeli', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">Margin (%) Baru (Opsional)</label>
            <Input
              type="number"
              value={formData.margin}
              onChange={(e) => handleInputChange('margin', e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm text-gray-600 font-medium">Harga Jual Baru (Opsional)</label>
            <Input
              type="number"
              value={formData.hargaJual}
              onChange={(e) => handleInputChange('hargaJual', e.target.value)}
            />
          </div>
        </div>
      </div>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsRestockDialogOpen(false)}>Batal</Button>
      <Button onClick={handleRestock}>Simpan</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Update Price Dialog */}
      <Dialog open={isUpdatePriceDialogOpen} onOpenChange={setIsUpdatePriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Harga Jual</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid gap-4 py-4 px-6">
              <div className="space-y-2">
                <h3 className="font-medium text-black">{selectedProduct.produk}</h3>
                <p className="text-sm text-gray-500">
                  Harga Beli: Rp {selectedProduct.hargaBeli.toLocaleString()}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-600 font-medium">Margin (%)</label>
                  <Input
                    type="number"
                    value={formData.margin}
                    onChange={(e) => handleInputChange('margin', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-600 font-medium">Harga Jual</label>
                  <Input
                    type="number"
                    value={formData.hargaJual}
                    onChange={(e) => handleInputChange('hargaJual', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdatePriceDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdatePrice}>
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <div className="py-4 px-6">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Apakah Anda yakin ingin menghapus stok masuk untuk produk{' '}
                <span className="font-semibold">{selectedProduct?.produk}</span>?
                Tindakan ini tidak dapat dibatalkan.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StokMasuk;