import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  CalendarRange,
  Receipt,
  ArrowDownWideNarrow,
  Wallet,
  QrCode,
  Building2,
  Package2,
  ChevronDown,
  FilterX,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { transactionService } from '@/lib/db/TransactionService';

const RiwayatTransaksi = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [isDetailOpen, setIsDetailOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get transactions from IndexedDB
      const transactionsData = await transactionService.getAllTransactions();
      
      // Sort by date and time, newest first
      const sortedTransactions = transactionsData.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      setTransactions(sortedTransactions);
    } catch (err) {
      setError('Gagal memuat data transaksi: ' + err.message);
      console.error('Load transactions error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-4 w-4" />;
      case 'qris':
        return <QrCode className="h-4 w-4" />;
      case 'transfer':
        return <Building2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPaymentLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Tunai';
      case 'qris':
        return 'QRIS';
      case 'transfer':
        return 'Transfer Bank';
      default:
        return method;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'pending':
        return 'Menunggu';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getTransactionTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = 
      filterStatus === 'all' || transaction.status === filterStatus;
    
    const matchesPayment = 
      filterPayment === 'all' || transaction.paymentMethod === filterPayment;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Memuat riwayat transaksi...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Receipt className="h-5 w-5 text-primary" />
              Riwayat Transaksi
            </CardTitle>
            <Button 
              variant="outline" 
              className="text-gray-600"
              onClick={() => navigate('/penjualan')}
            >
              Transaksi Baru
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cari transaksi atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="md:col-span-7 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-between text-gray-600"
              >
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  Hari Ini
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="flex-1 justify-between text-gray-600"
                onClick={() => setFilterStatus(filterStatus === 'all' ? 'completed' : 'all')}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownWideNarrow className="h-4 w-4" />
                  {filterStatus === 'all' ? 'Semua Status' : getStatusLabel(filterStatus)}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="flex-1 justify-between text-gray-600"
                onClick={() => setFilterPayment(filterPayment === 'all' ? 'cash' : 'all')}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {filterPayment === 'all' ? 'Semua Pembayaran' : getPaymentLabel(filterPayment)}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {(filterStatus !== 'all' || filterPayment !== 'all' || searchTerm) && (
                <Button
                  variant="ghost"
                  className="px-3 text-gray-600"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterPayment('all');
                    setSearchTerm('');
                  }}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div 
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setIsDetailOpen(
                    isDetailOpen === transaction.id ? null : transaction.id
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {transaction.id}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString('id-ID')} - {getTransactionTime(transaction.date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(transaction.paymentMethod)}
                      <span className="text-sm text-gray-600">
                        {getPaymentLabel(transaction.paymentMethod)}
                      </span>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      getStatusColor(transaction.status)
                    }`}>
                      {getStatusLabel(transaction.status)}
                    </div>
                    
                    <span className="font-medium text-gray-800">
                      Rp {transaction.total.toLocaleString()}
                    </span>
                    
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      isDetailOpen === transaction.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>

                {isDetailOpen === transaction.id && (
                  <div className="mt-4 pl-4 border-l-2">
                    <div className="space-y-3">
                      {transaction.items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Package2 className="h-4 w-4 text-gray-500" />
                            <div>
                              <h4 className="font-medium text-gray-800">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                {item.quantity} x Rp {item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span className="font-medium text-gray-800">
                            Rp {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}

                      {transaction.paymentMethod === 'cash' && (
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Tunai:</span>
                            <span>Rp {transaction.cashAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kembalian:</span>
                            <span>Rp {transaction.change.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Tidak ada transaksi yang ditemukan
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiwayatTransaksi;