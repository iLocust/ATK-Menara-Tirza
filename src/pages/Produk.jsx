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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Products = () => {
  // Sample data - replace with actual data from your backend
  const products = [
    { id: 1, name: 'Buku Tulis', category: 'Alat Tulis', price: 'Rp 5.000' },
    { id: 2, name: 'Pulpen', category: 'Alat Tulis', price: 'Rp 3.500' },
    { id: 3, name: 'Pensil', category: 'Alat Tulis', price: 'Rp 2.000' },
    { id: 4, name: 'Penghapus', category: 'Alat Tulis', price: 'Rp 1.500' },
    { id: 5, name: 'Penggaris', category: 'Alat Ukur', price: 'Rp 4.000' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Produk</h1>
        <Button className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Tambah Produk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produk Koperasi ATK</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;