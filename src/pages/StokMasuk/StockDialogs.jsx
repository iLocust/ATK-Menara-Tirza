/* eslint-disable react/prop-types */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusIcon } from 'lucide-react';

export const AddStockDialog = ({
  isOpen,
  onOpenChange,
  formData,
  formErrors,
  error,
  onInputChange,
  onSubmit
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <div className="grid gap-4 px-6 py-4">
          {error && (
            <Alert variant="destructive" className="mx-0">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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

          <div className="grid grid-cols-2 gap-4">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={onSubmit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const RestockDialog = ({
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

export const UpdatePriceDialog = ({
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Harga Jual</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 px-6">
          <div className="space-y-2">
            <h3 className="font-medium text-black">{selectedProduct.produk}</h3>
            <p className="text-sm text-gray-500">
              Harga Beli: Rp {selectedProduct.hargaBeli.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Barcode: {selectedProduct.barcode}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Margin (%)</label>
              <Input
                type="number"
                value={formData.margin}
                onChange={(e) => onInputChange('margin', e.target.value)}
                className="text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Harga Jual</label>
              <Input
                type="number"
                value={formData.hargaJual}
                onChange={(e) => onInputChange('hargaJual', e.target.value)}
                className="text-right"
              />
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

export const DeleteDialog = ({
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