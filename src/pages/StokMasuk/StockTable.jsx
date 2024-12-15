/* eslint-disable react/prop-types */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, PencilIcon, TrashIcon, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export const StockTable = ({
  stock,
  onRestock,
  onUpdatePrice,
  onDelete,
  onPrintBarcode
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-medium text-gray-900 text-sm py-2">Kategori</TableHead>
          <TableHead className="font-medium text-gray-900 text-sm py-2">Produk</TableHead>
          <TableHead className="font-medium text-gray-900 text-sm py-2">Jumlah</TableHead>
          <TableHead className="font-medium text-gray-900 text-sm py-2">Harga Beli</TableHead>
          <TableHead className="font-medium text-gray-900 text-sm py-2">Harga Jual</TableHead>
          <TableHead className="font-medium text-gray-900 text-sm py-2">Barcode</TableHead>
          <TableHead className="font-medium text-center text-gray-900 text-sm py-2">Aksi</TableHead>
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
            <TableCell className="text-gray-900 text-sm py-1.5">
              {item.barcode ? (
                <div className="flex flex-col items-start gap-1">
                  <svg ref={(ref) => {
                    if (ref) {
                      try {
                        JsBarcode(ref, item.barcode, {
                          format: "EAN13",
                          width: 2,
                          height: 50,
                          displayValue: true,
                          fontSize: 14,
                          margin: 0
                        });
                      } catch (err) {
                        console.error('Error generating barcode:', err);
                      }
                    }
                  }} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onPrintBarcode(item.barcode)}
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Print Barcode
                  </Button>
                </div>
              ) : '-'}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => onRestock(item)}
                  className="hover:bg-blue-100 text-blue-600"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onUpdatePrice(item)}
                  className="hover:bg-gray-100"
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onDelete(item)}
                  className="hover:bg-red-100 text-red-600"
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};