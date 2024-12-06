import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { transactionService } from '@/lib/db/TransactionService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Wallet, Building2, Package2, CheckCircle2,
  AlertCircle, Receipt
} from 'lucide-react';

const Pembayaran = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, subtotal, transactionId } = location.state;
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [dateInput, setDateInput] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Tunai',
      icon: Wallet,
      description: 'Pembayaran dengan uang tunai'
    },
    {
      id: 'transfer',
      name: 'Transfer Bank',
      icon: Building2,
      description: 'Transfer melalui rekening bank'
    }
  ];

  const commonAmounts = [
    { value: 10000, label: '10.000' },
    { value: 20000, label: '20.000' },
    { value: 50000, label: '50.000' },
    { value: 100000, label: '100.000' }
  ];
  
  const change = cashAmount ? parseInt(cashAmount.replace(/\D/g, '')) - subtotal : 0;

  const formatDateInput = (input) => {
    const numbers = input.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0,2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0,2)}/${numbers.slice(2,4)}/${numbers.slice(4,8)}`;
  };

  const convertToISODate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  const validateDate = (dateStr) => {
    if (!dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return false;
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date instanceof Date && !isNaN(date) &&
           date.getDate() === day &&
           date.getMonth() === month - 1 &&
           date.getFullYear() === year;
  };

  const handleDateChange = (e) => {
    const formatted = formatDateInput(e.target.value);
    setDateInput(formatted);
  };

  const handlePayment = async () => {
    try {
      if (!validateDate(dateInput)) {
        setError('Format tanggal tidak valid. Gunakan format DD/MM/YYYY');
        return;
      }

      setIsProcessing(true);
      setError(null);

      const transactionData = {
        transactionId,
        date: convertToISODate(dateInput),
        subtotal,
        paymentMethod,
        cashAmount: paymentMethod === 'cash' ? parseInt(cashAmount.replace(/\D/g, '')) : subtotal,
        change: paymentMethod === 'cash' ? change : 0,
        status: 'completed'
      };

      await transactionService.processTransaction(transactionData, cart);
      setShowSuccessDialog(true);

      setTimeout(() => {
        navigate('/penjualan');
      }, 3000);

    } catch (err) {
      setError('Gagal memproses pembayaran: ' + err.message);
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setDateInput(`${day}/${month}/${year}`);
  }, []);

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Button 
        variant="ghost" 
        className="mb-4 text-gray-700 hover:bg-gray-100"
        onClick={() => navigate('/penjualan')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Penjualan
      </Button>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Pembayaran Berhasil!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID Transaksi:</span>
                <span className="font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">Rp {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Metode:</span>
                <span className="font-medium">
                  {paymentMethod === 'cash' ? 'Tunai' : 'Transfer Bank'}
                </span>
              </div>
              {paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dibayar:</span>
                    <span className="font-medium">
                      Rp {parseInt(cashAmount.replace(/\D/g, '')).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kembalian:</span>
                    <span className="font-medium text-green-600">
                      Rp {change.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tanggal:</span>
                <span className="font-medium">{dateInput}</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">
              Mengalihkan ke halaman penjualan dalam beberapa detik...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-fit shadow-sm">
          <CardHeader className="border-b bg-white">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Receipt className="h-5 w-5 text-primary" />
              Ringkasan Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Package2 className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
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
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Jumlah Item:</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} barang</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-800">Total Pembayaran:</span>
                  <span className="text-primary">Rp {subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-sm">
          <CardHeader className="border-b bg-white">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Wallet className="h-5 w-5 text-primary" />
              Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Tanggal Transaksi (DD/MM/YYYY)
                  </label>
                  <Input
                    type="text"
                    value={dateInput}
                    onChange={handleDateChange}
                    placeholder="DD/MM/YYYY"
                    maxLength="10"
                    className="bg-white border-gray-200"
                  />
                  <p className="text-xs text-gray-500">
                    Contoh: 01/12/2024
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      className={`w-full p-4 rounded-lg border transition-colors duration-200 flex items-center gap-4 ${
                        paymentMethod === method.id 
                          ? 'bg-white border-primary text-gray-800 shadow-sm' 
                          : 'bg-white border-gray-200 hover:border-primary/50 hover:bg-gray-50/50'
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className={`p-2 rounded-full ${
                        paymentMethod === method.id 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-primary'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'cash' && (
                <div className="mt-6 space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white hover:bg-gray-50 hover:text-primary text-gray-700 border-gray-200"
                    onClick={() => setCashAmount(subtotal.toString())}
                  >
                    Uang Pas - Rp {subtotal.toLocaleString()}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {commonAmounts.map(({ value, label }) => (
                      <Button
                        key={value}
                        variant="outline"
                        onClick={() => setCashAmount(value.toString())}
                        className={`font-medium ${
                          parseInt(cashAmount?.replace(/\D/g, '') || '0') === value
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-primary'
                        }`}
                      >
                        Rp {label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Jumlah Uang Custom
                    </label>
                    <Input
                      type="text"
                      placeholder="Masukkan jumlah uang"
                      value={cashAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numberOnly = value.replace(/\D/g, '');
                        const formatted = numberOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        setCashAmount(formatted);
                      }}
                      className="text-lg bg-white border-gray-200 text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  {cashAmount && (
                    <div className="rounded-lg border p-4 space-y-3 bg-gray-50/50">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Total Pembayaran:</span>
                        <span>Rp {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Jumlah Dibayar:</span>
                        <span>Rp {parseInt(cashAmount.replace(/\D/g, '')).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-800">Kembalian:</span>
                          <span className={change < 0 ? 'text-red-500' : 'text-green-500'}>
                            Rp {change.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {change < 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Jumlah pembayaran kurang dari total belanja
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="mt-6 space-y-4">
                  <div className="border rounded-lg p-6 space-y-4 bg-white">
                    <div className="text-center">
                      <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                      <p className="font-semibold mb-1 text-gray-800">Transfer ke rekening:</p>
                      <p className="text-xl font-mono bg-gray-50 p-2 rounded text-gray-800">1234-5678-9012</p>
                      <p className="text-sm text-gray-600 mt-2">a.n. Koperasi ATK</p>
                    </div>
                    <div className="border-t pt-4 text-center">
                      <p className="font-semibold mb-1 text-gray-800">Total Pembayaran</p>
                      <p className="text-2xl font-bold text-primary">
                        Rp {subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-6"
                size="lg"
                disabled={
                  !paymentMethod || 
                  (paymentMethod === 'cash' && (parseInt(cashAmount?.replace(/\D/g, '') || '0') < subtotal)) ||
                  isProcessing
                }
                onClick={handlePayment}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Memproses Pembayaran...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Selesaikan Pembayaran
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pembayaran;