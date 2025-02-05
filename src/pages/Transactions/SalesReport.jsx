import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, Loader2, Download, School } from 'lucide-react';
import { transactionService } from '@/lib/db/TransactionService';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportSalesReport, exportCombinedReport } from './excelUtils';

const SalesReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth().month);
  const [selectedYear, setSelectedYear] = useState(getCurrentMonth().year);

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear]);

  const getInternalLabel = (number) => {
    const labels = {
      1: 'TK',
      2: 'SD',
      3: 'SMP',
      4: 'SMA',
      5: 'MK'
    };
    return labels[number] || `Internal ${number}`;
  };

  function getCurrentMonth() {
    const date = new Date();
    return {
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear())
    };
  }

  function getMonthOptions() {
    return [
      { value: "01", label: "Januari" },
      { value: "02", label: "Februari" },
      { value: "03", label: "Maret" },
      { value: "04", label: "April" },
      { value: "05", label: "Mei" },
      { value: "06", label: "Juni" },
      { value: "07", label: "Juli" },
      { value: "08", label: "Agustus" },
      { value: "09", label: "September" },
      { value: "10", label: "Oktober" },
      { value: "11", label: "November" },
      { value: "12", label: "Desember" }
    ];
  }

  function getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // 2 tahun ke belakang
    for (let i = 2; i > 0; i--) {
      const year = currentYear - i;
      years.push({ value: String(year), label: String(year) });
    }
    
    // Tahun sekarang
    years.push({ value: String(currentYear), label: String(currentYear) });
    
    // 3 tahun ke depan
    for (let i = 1; i <= 3; i++) {
      const year = currentYear + i;
      years.push({ value: String(year), label: String(year) });
    }
    
    return years;
  }

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const start = new Date(selectedYear, parseInt(selectedMonth) - 1, 1);
      const end = new Date(selectedYear, parseInt(selectedMonth), 0, 23, 59, 59);
      
      const data = await transactionService.getTransactionsByDateRange(start, end);
      setTransactions(data);
    } catch (err) {
      setError('Gagal memuat data transaksi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
  };

  const groupTransactionsByDate = () => {
    const groups = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('id-ID');
      if (!groups[date]) {
        groups[date] = {
          date,
          paymentSummary: { 
            cash: 0,
            transfer: 0
          },
          internalSummary: {
            total: 0,
            byNumber: {
              1: { count: 0, total: 0 },
              2: { count: 0, total: 0 },
              3: { count: 0, total: 0 },
              4: { count: 0, total: 0 },
              5: { count: 0, total: 0 }
            }
          },
          transactions: [],
          dailyTotal: 0
        };
      }
      
      const items = transaction.items;
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      groups[date].transactions.push({
        items,
        paymentMethod: transaction.paymentMethod.toLowerCase(),
        total,
        isInternal: transaction.isInternal,
        internalNumber: transaction.internalNumber
      });

      if (transaction.paymentMethod.toLowerCase() === 'cash') {
        groups[date].paymentSummary.cash += total;
      } else if (transaction.paymentMethod.toLowerCase() === 'transfer') {
        groups[date].paymentSummary.transfer += total;
      }

      if (transaction.isInternal && transaction.internalNumber) {
        groups[date].internalSummary.total += total;
        groups[date].internalSummary.byNumber[transaction.internalNumber].count++;
        groups[date].internalSummary.byNumber[transaction.internalNumber].total += total;
      }
      
      groups[date].dailyTotal += total;
    });

    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate monthly totals for each internal number
  const calculateMonthlyInternalTotals = () => {
    const totals = {
      1: { count: 0, total: 0 },
      2: { count: 0, total: 0 },
      3: { count: 0, total: 0 },
      4: { count: 0, total: 0 },
      5: { count: 0, total: 0 }
    };

    dailyGroups.forEach(day => {
      Object.entries(day.internalSummary.byNumber).forEach(([number, data]) => {
        totals[number].count += data.count;
        totals[number].total += data.total;
      });
    });

    return totals;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Memuat data penjualan...</span>
      </div>
    );
  }

  const dailyGroups = groupTransactionsByDate();
  const monthlyTotal = dailyGroups.reduce((sum, day) => sum + day.dailyTotal, 0);
  const monthlyInternalTotals = calculateMonthlyInternalTotals();

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Rekap Penjualan
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => dailyGroups?.length ? exportSalesReport(dailyGroups) : null}
                    disabled={!dailyGroups?.length}
                    variant="outline"
                    className="bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Rekap Harian
                  </Button>
                  <Button
                    onClick={() => transactions?.length ? exportCombinedReport(transactions) : null}
                    disabled={!transactions?.length}
                    variant="outline"
                    className="bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Rekap Bulanan
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {getYearOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="overflow-x-auto">
            {dailyGroups.map((dayData) => (
              <div key={dayData.date} className="mb-8">
                <div className="bg-primary/5 p-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <h2 className="font-extrabold text-base">Penjualan {dayData.date}</h2>
                      <div className="space-x-3">
                        <span>Tunai: Rp {dayData.paymentSummary.cash.toLocaleString()}</span>
                        <span>Transfer: Rp {dayData.paymentSummary.transfer.toLocaleString()}</span>
                      </div>
                    </div>
             
                    <div className="text-right font-medium">
                      Total: Rp {dayData.dailyTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-2 py-1.5 text-left">Produk</th>
                      <th className="px-2 py-1.5 text-left">Kategori</th>
                      <th className="px-2 py-1.5 text-right">Jml</th>
                      <th className="px-2 py-1.5 text-right">Harga</th>
                      <th className="px-2 py-1.5 text-right">Penjualan</th>
                      <th className="px-2 py-1.5 text-right">Subtotal</th>
                      <th className="px-2 py-1.5 text-center">Metode</th>
                      <th className="px-2 py-1.5 text-center">Jenis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayData.transactions.map((transaction, tIdx) => {
                      const itemCount = transaction.items.length;
                      return transaction.items.map((item, iIdx) => (
                        <tr key={`${tIdx}-${iIdx}`} className={`border-b hover:bg-gray-50 ${
                          transaction.isInternal ? 'bg-blue-50/50' : ''
                        }`}>
                          <td className="px-2 py-1.5">{item.name}</td>
                          <td className="px-2 py-1.5">{item.kategori}</td>
                          <td className="px-2 py-1.5 text-right">{item.quantity}</td>
                          <td className="px-2 py-1.5 text-right">{item.price.toLocaleString()}</td>
                          <td className="px-2 py-1.5 text-right">
                            {(item.price * item.quantity).toLocaleString()}
                          </td>
                          {iIdx === 0 && (
                            <>
                              <td className="px-2 py-1.5 text-right" rowSpan={itemCount}>
                                {transaction.total.toLocaleString()}
                              </td>
                              <td className="px-2 py-1.5 text-center" rowSpan={itemCount}>
                                {transaction.paymentMethod}
                              </td>
                              <td className="px-2 py-1.5 text-center" rowSpan={itemCount}>
                                {transaction.isInternal ? (
                                  <div className="flex items-center justify-center text-blue-600">
                                    <School className="h-4 w-4 mr-1" />
                                    {getInternalLabel(transaction.internalNumber)}
                                  </div>
                                ) : 'Umum'}
                              </td>
                            </>
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            
            {/* Monthly Summary */}
            <div className="mt-4 bg-primary/5 px-3 py-2">
              <div className="flex flex-col gap-2">
                <div className="text-right font-medium text-primary">
                  Total Keseluruhan: Rp {monthlyTotal.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReport;