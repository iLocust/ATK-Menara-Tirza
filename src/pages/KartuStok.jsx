import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
  } from "@/components/ui/card";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { Input } from "@/components/ui/input";
  
  const KartuStok = () => {
    // Sample data - ganti dengan data dari backend
    const stockCards = [
      { 
        id: 1, 
        tanggal: '2024-01-01', 
        produk: 'Buku Tulis',
        keterangan: 'Stok Awal',
        masuk: 100,
        keluar: 0,
        saldo: 100
      },
      { 
        id: 2, 
        tanggal: '2024-01-02', 
        produk: 'Buku Tulis',
        keterangan: 'Penjualan',
        masuk: 0,
        keluar: 15,
        saldo: 85
      },
      { 
        id: 3, 
        tanggal: '2024-01-03', 
        produk: 'Buku Tulis',
        keterangan: 'Pembelian',
        masuk: 50,
        keluar: 0,
        saldo: 135
      },
    ];
  
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kartu Stok</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <Input type="date" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Selesai
              </label>
              <Input type="date" />
            </div>
          </div>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kartu Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead>Keluar</TableHead>
                  <TableHead>Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockCards.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.tanggal}</TableCell>
                    <TableCell>{item.produk}</TableCell>
                    <TableCell>{item.keterangan}</TableCell>
                    <TableCell>{item.masuk}</TableCell>
                    <TableCell>{item.keluar}</TableCell>
                    <TableCell>{item.saldo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  export {KartuStok}