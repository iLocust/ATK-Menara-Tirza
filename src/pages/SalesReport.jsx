import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, Loader2 } from 'lucide-react';
import { transactionService } from '@/lib/db/TransactionService';
import { Alert, AlertDescription } from "@/components/ui/alert";

const SalesReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Gagal memuat data transaksi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const groupTransactionsByMethod = () => {
    const groups = transactions.reduce((acc, transaction) => {
      const method = transaction.paymentMethod;
      if (!acc[method]) acc[method] = { items: [], total: 0 };
      
      transaction.items.forEach(item => {
        acc[method].items.push({
          ...item,
          subtotal: item.price * item.quantity
        });
        acc[method].total += item.price * item.quantity;
      });
      
      return acc;
    }, {});

    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Memuat data penjualan...</span>
      </div>
    );
  }

  const groups = groupTransactionsByMethod();
  const grandTotal = Object.values(groups).reduce((sum, group) => sum + group.total, 0);

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Penjualan ATK PerTgl {new Date().toLocaleDateString('id-ID', { 
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-6">
            {Object.entries(groups).map(([method, group]) => (
              <div key={method} className="border-b last:border-0">
                <div className="px-6 py-3 bg-gray-50 font-medium text-gray-700">
                  {method === 'cash' ? 'Pembayaran Tunai' : 'Pembayaran Transfer'}
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Nama Produk</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Kategori</th>
                      <th className="px-6 py-3 text-center text-sm font-medium text-gray-600">Jumlah</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Harga</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-600">Penjualan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{item.name}</td>
                        <td className="px-6 py-3 text-sm">ATK</td>
                        <td className="px-6 py-3 text-sm text-center">{item.quantity}</td>
                        <td className="px-6 py-3 text-sm text-right">
                          {item.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm text-right">
                          {item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td colSpan={4} className="px-6 py-3 text-sm text-right">
                        Subtotal {method === 'cash' ? 'Tunai' : 'Transfer'}:
                      </td>
                      <td className="px-6 py-3 text-sm text-right">
                        {group.total.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}

            <div className="px-6 py-3 bg-primary/5 font-medium">
              <div className="text-right text-lg text-primary">
                Total Keseluruhan: Rp {grandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReport;