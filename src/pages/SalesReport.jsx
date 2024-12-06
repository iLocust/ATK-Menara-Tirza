import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, Loader2, Download } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { exportSalesReport, exportCombinedReport } from './excelUtils';

const SalesReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, startDate, endDate]);

  function getCurrentMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthOptions() {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const [year, month] = selectedMonth.split('-');
      let start, end;
      
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59);
      } else {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
      }
      
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
    setStartDate('');
    setEndDate('');
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setStartDate(value);
    if (value && (!endDate || new Date(value) > new Date(endDate))) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    if (!startDate || value >= startDate) {
      setEndDate(value);
    }
  };

  const getDateConstraints = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStart = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${month}-${lastDay}`;
    return { min: monthStart, max: monthEnd };
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
          transactions: [],
          dailyTotal: 0
        };
      }
      
      const items = transaction.items;
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      groups[date].transactions.push({
        items,
        paymentMethod: transaction.paymentMethod.toLowerCase(),
        total
      });

      if (transaction.paymentMethod.toLowerCase() === 'cash') {
        groups[date].paymentSummary.cash += total;
      } else if (transaction.paymentMethod.toLowerCase() === 'transfer') {
        groups[date].paymentSummary.transfer += total;
      }
      
      groups[date].dailyTotal += total;
    });

    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const dateConstraints = getDateConstraints();

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
                    onClick={() => exportSalesReport(dailyGroups)}
                    variant="outline"
                    className="bg-white hover:bg-gray-50"
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
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[240px]">
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
            </div>

            <div className="flex gap-4 justify-end items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Dari:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  min={dateConstraints.min}
                  max={dateConstraints.max}
                  className="w-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Sampai:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  min={startDate || dateConstraints.min}
                  max={dateConstraints.max}
                  className="w-[200px]"
                />
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
              <div key={dayData.date} className="mb-8" >
                <div className="bg-primary/5 p-2">
                  <div className="flex justify-between items-center text-sm">
                    <h2 className="font-extrabold text-base">Penjualan {dayData.date}</h2>
                    <div className="space-x-3">
                      <span>Tunai: Rp {dayData.paymentSummary.cash.toLocaleString()}</span>
                      <span>Transfer: Rp {dayData.paymentSummary.transfer.toLocaleString()}</span>
                      <span className="font-medium">Total: Rp {dayData.dailyTotal.toLocaleString()}</span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {dayData.transactions.map((transaction, tIdx) => {
                      const itemCount = transaction.items.length;
                      return transaction.items.map((item, iIdx) => (
                        <tr key={`${tIdx}-${iIdx}`} className="border-b hover:bg-gray-50">
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
                            </>
                          )}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="mt-4 bg-primary/5 px-3 py-2">
              <div className="text-right font-medium text-primary">
                Total Keseluruhan: Rp {monthlyTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReport;