/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Barcode, Plus, PencilIcon, TrashIcon, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import JsBarcode from 'jsbarcode';

const ActionDialog = ({
  isOpen,
  onClose,
  item,
  onRestock,
  onUpdatePrice,
  onDelete,
  onPrintBarcode
}) => {
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
          {item.barcode && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Barcode</p>
              <div className="flex flex-col items-center">
                <svg ref={(ref) => {
                  if (ref) {
                    try {
                      JsBarcode(ref, item.barcode, {
                        format: "EAN13",
                        width: 2,
                        height: 80,
                        displayValue: true,
                        fontSize: 14,
                        margin: 5
                      });
                    } catch (err) {
                      console.error('Error generating barcode:', err);
                    }
                  }
                }} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintBarcode(item.barcode)}
                  className="mt-2"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Barcode
                </Button>
              </div>
            </div>
          )}

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
              <span className="text-sm font-medium text-gray-700">Update Harga</span>
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
  onPrintBarcode
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
      />
    </>
  );
};