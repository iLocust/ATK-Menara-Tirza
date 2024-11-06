import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Wallet, 
  QrCode, 
  Building2, 
  Package2, 
  CheckCircle2,
  AlertCircle,
  Receipt
} from 'lucide-react';

const Pembayaran = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, subtotal } = location.state;
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Tunai',
      icon: Wallet,
      description: 'Pembayaran dengan uang tunai'
    },
    {
      id: 'qris',
      name: 'QRIS',
      icon: QrCode,
      description: 'Scan & pay dengan e-wallet atau mobile banking'
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
  
  const change = cashAmount ? parseInt(cashAmount) - subtotal : 0;

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      console.log('Processing payment:', {
        method: paymentMethod,
        amount: cashAmount || 'QRIS/Transfer',
        total: subtotal,
        change: change
      });
      setIsProcessing(false);
      navigate('/penjualan');
    }, 1500);
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <Button 
        variant="ghost" 
        className="mb-4 text-white-700 hover:bg-white-100"
        onClick={() => navigate('/penjualan')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Penjualan
      </Button>
      
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
                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 transition-colors"
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
              
              <div className="border-t pt-4 mt-4">
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

              {paymentMethod && (
                <div className="mt-6 pt-6 border-t">
                  {paymentMethod === 'cash' && (
                    <div className="space-y-4">
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
                              cashAmount === value.toString() 
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
                          type="number"
                          placeholder="Masukkan jumlah uang"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
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
                            <span>Rp {parseInt(cashAmount).toLocaleString()}</span>
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

                  {paymentMethod === 'qris' && (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-6 text-center space-y-4 bg-white">
                        <div className="bg-gray-100 p-8 rounded-lg inline-block mx-auto">
                          <QrCode className="w-32 h-32 mx-auto text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold mb-1 text-gray-800">Total Pembayaran</p>
                          <p className="text-2xl font-bold text-primary">
                            Rp {subtotal.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Scan QR code di atas menggunakan aplikasi e-wallet atau mobile banking Anda
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'transfer' && (
                    <div className="space-y-4">
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
                      (paymentMethod === 'cash' && (parseInt(cashAmount) < subtotal)) ||
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pembayaran;