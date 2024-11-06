import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const StokMasuk = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sample data - ganti dengan data dari backend
  const incomingStock = [
    { 
      id: 1, 
      tanggal: '2024-01-01',
      nomorDokumen: 'IN-001',
      produk: 'Buku Tulis',
      jumlah: 100,
      supplier: 'PT Supplier ATK'
    },
    { 
      id: 2, 
      tanggal: '2024-01-03',
      nomorDokumen: 'IN-002',
      produk: 'Pulpen',
      jumlah: 200,
      supplier: 'PT Supplier ATK'
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Stok Masuk</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Tambah Stok Masuk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Stok Masuk</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nomor Dokumen
                </label>
                <Input placeholder="Masukkan nomor dokumen" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tanggal
                </label>
                <Input type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Produk
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buku">Buku Tulis</SelectItem>
                    <SelectItem value="pulpen">Pulpen</SelectItem>
                    <SelectItem value="pensil">Pensil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jumlah
                </label>
                <Input type="number" placeholder="Masukkan jumlah" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Supplier
                </label>
                <Input placeholder="Masukkan nama supplier" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button>Simpan</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Stok Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Dokumen</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.tanggal}</TableCell>
                  <TableCell>{item.nomorDokumen}</TableCell>
                  <TableCell>{item.produk}</TableCell>
                  <TableCell>{item.jumlah}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export {StokMasuk };