import { useState, useEffect } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Search, ArrowDownWideNarrow, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { cashFlowService } from '@/lib/db/CashFlowService';
import { exportCashFlow } from './excelUtils';
import { dbService } from '../../lib/db/db-service';

const UnifiedCashManagement = () => {
  const [balance, setBalance] = useState({ cash: 0, transfer: 0 });
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('cash');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState({
    dailyBalance: { cash: [], transfer: [] },
    totalIncome: { cash: 0, transfer: 0 },
    totalExpense: { cash: 0, transfer: 0 }
  });

  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    paymentMethod: 'cash'
  });
  
  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 2;
    const endYear = currentYear + 2;
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];
  const [lastMonthBalance, setLastMonthBalance] = useState({ cashBalance: 0, transferBalance: 0 });

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      
      const previousMonthKey = `${previousYear}-${previousMonth.toString().padStart(2, '0')}`;
      const currentMonthKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      const previousMonthBalances = await dbService.getAllFromIndex('monthlyBalance', 'monthKey', previousMonthKey);
      const previousMonthBalance = previousMonthBalances.length > 0 
        ? previousMonthBalances[0] 
        : { cashBalance: 0, transferBalance: 0 };
      
      setLastMonthBalance(previousMonthBalance);
      
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay}`;
      
      await cashFlowService.updateBalancesForDateRange(startDate, endDate);
      
      const currentMonthBalances = await dbService.getAllFromIndex('monthlyBalance', 'monthKey', currentMonthKey);
      
      let currentBalance;
      if (currentMonthBalances.length > 0) {
        currentBalance = {
          cash: currentMonthBalances[0].cashBalance,
          transfer: currentMonthBalances[0].transferBalance
        };
      } else {
        const cashBalance = await cashFlowService.getCashBalance();
        const transferBalance = await cashFlowService.getTransferBalance();
        currentBalance = { cash: cashBalance, transfer: transferBalance };
      }
      
      setBalance(currentBalance);
      
      const summary = await cashFlowService.getCashFlowSummary(startDate, endDate);
      
      const cashDailyBalance = summary.dailyBalance.cash.map(day => ({
        ...day,
        runningBalance: previousMonthBalance.cashBalance + day.dailyBalance
      }));
      
      const transferDailyBalance = summary.dailyBalance.transfer.map(day => ({
        ...day,
        runningBalance: previousMonthBalance.transferBalance + day.dailyBalance
      }));
      
      let cashRunningBalance = previousMonthBalance.cashBalance;
      let transferRunningBalance = previousMonthBalance.transferBalance;
      
      cashDailyBalance.forEach(day => {
        cashRunningBalance += (day.income - day.expense);
        day.runningBalance = cashRunningBalance;
      });
      
      transferDailyBalance.forEach(day => {
        transferRunningBalance += (day.income - day.expense);
        day.runningBalance = transferRunningBalance;
      });
      
      setMonthlyData({
        dailyBalance: {
          cash: cashDailyBalance,
          transfer: transferDailyBalance
        },
        totalIncome: {
          cash: summary.cash.income,
          transfer: summary.transfer.income
        },
        totalExpense: {
          cash: summary.cash.expense,
          transfer: summary.transfer.expense
        },
        transactions: summary.transactions
      });
      
      setTransactions(summary.transactions);
      setFilteredTransactions(summary.transactions);
  
    } catch (err) {
      console.error('LoadData Error:', err);
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDailyBalance = (dailyBalance) => {
    // Get current date and set to start of day in local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow and set to start of day
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate());
    tomorrow.setHours(0, 0, 0, 0);
  
    return dailyBalance.filter(item => {
      // Convert item date to local time start of day
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      
      // Debug logs
      
      return itemDate <= tomorrow;
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const currentDate = new Date();
      // Set to local timezone
      currentDate.setMinutes(currentDate.getMinutes() - currentDate.getTimezoneOffset());
      
      const newTransaction = {
        ...formData,
        amount: parseInt(formData.amount.replace(/\./g, '')),
        date: currentDate.toISOString().split('T')[0], // Use current date
        timestamp: currentDate.getTime()
      };

      await cashFlowService.addCashFlow(newTransaction);
      await loadData();

      setFormData({
        type: 'income',
        amount: '',
        description: '',
        paymentMethod: 'cash'
      });
      setIsDialogOpen(false);
    } catch (err) {
      setError('Gagal menambah transaksi: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Memuat data kas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kas Koperasi</h1>
          <p className="text-gray-600 mt-1">
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => exportCashFlow(monthlyData, selectedMonth, selectedYear)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Tambah Transaksi</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto top-[40vh]">
          <DialogHeader>
            <DialogTitle>Tambah Transaksi Kas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 p-5">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Jenis Transaksi</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Jumlah</label>
              <Input
                type="text"
                placeholder="Masukkan jumlah"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  const numberOnly = value.replace(/\D/g, '');
                  const formatted = numberOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                  setFormData({ ...formData, amount: formatted });
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-600 font-medium">Keterangan</label>
              <Input
                placeholder="Masukkan keterangan"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.amount || !formData.description}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Saldo Kas (Tunai)</CardTitle>
            <Wallet className="h-7 w-7 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-center font-bold">Rp {balance.cash.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Total Pemasukan</CardTitle>
            <ArrowUpRight className="h-7 w-7 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-green-600">
              Tunai: Rp {monthlyData.totalIncome.cash.toLocaleString()}
            </div>
            <div className="text-lg font-semibold text-green-600">
              Transfer: Rp {monthlyData.totalIncome.transfer.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownRight className="h-7 w-7 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-red-600">
              Tunai: Rp {monthlyData.totalExpense.cash.toLocaleString()}
            </div>
            <div className="text-lg font-semibold text-red-600">
              Transfer: Rp {monthlyData.totalExpense.transfer.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Bulan" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Tahun" />
          </SelectTrigger>
          <SelectContent>
            {getYearRange().map((year) => (<SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="daily" className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="daily" className="flex-1 data-[state=active]:font-bold">Rincian Saldo Harian</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 data-[state=active]:font-bold">Riwayat Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Rincian Saldo Harian</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="cash">Tunai</TabsTrigger>
                    <TabsTrigger value="transfer">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left font-medium">Tanggal</th>
                    <th className="py-3 px-4 text-right font-medium">Masuk</th>
                    <th className="py-3 px-4 text-right font-medium">Keluar</th>
                    <th className="py-3 px-4 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      Saldo {months.find(m => m.value === (selectedMonth === 1 ? 12 : selectedMonth - 1))?.label}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">-</td>
                    <td className="py-3 px-4 text-right text-red-600">-</td>
                    <td className="py-3 px-4 text-right font-bold">
                      Rp {activeTab === 'cash' 
                        ? lastMonthBalance.cashBalance.toLocaleString() 
                        : lastMonthBalance.transferBalance.toLocaleString()}
                    </td>
                  </tr>

                  {filterDailyBalance(monthlyData.dailyBalance[activeTab]).map((item) => (
  <tr key={item.date} className="border-b hover:bg-gray-50">
    <td className="py-3 px-4">
      {new Date(item.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}
    </td>
    <td className="py-3 px-4 text-right text-green-600">
      {item.income > 0 ? `Rp ${item.income.toLocaleString()}` : '-'}
    </td>
    <td className="py-3 px-4 text-right text-red-600">
      {item.expense > 0 ? `Rp ${item.expense.toLocaleString()}` : '-'}
    </td>
    <td className="py-3 px-4 text-right font-bold">
      Rp {item.runningBalance.toLocaleString()}
    </td>
  </tr>
                  ))}

                  <tr className="border-t-2 border-b bg-gray-100 font-medium">
                    <td className="py-4 px-4 font-medium">
                      Total Pendapatan - Pengeluaran
                    </td>
                    <td className="py-4 px-4 text-right text-green-600">
                      Rp {activeTab === 'cash' 
                        ? monthlyData.totalIncome.cash.toLocaleString()
                        : monthlyData.totalIncome.transfer.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-red-600">
                      Rp {activeTab === 'cash'
                        ? monthlyData.totalExpense.cash.toLocaleString()
                        : monthlyData.totalExpense.transfer.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-bold">
                      Rp {activeTab === 'cash'
                        ? (monthlyData.totalIncome.cash - monthlyData.totalExpense.cash).toLocaleString()
                        : (monthlyData.totalIncome.transfer - monthlyData.totalExpense.transfer).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="border-b">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="cash">Tunai</TabsTrigger>
                      <TabsTrigger value="transfer">Transfer</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Cari transaksi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setFilterType(filterType === 'all' ? 'income' : filterType === 'income' ? 'expense' : 'all')}
                  >
                    <ArrowDownWideNarrow className="h-4 w-4" />
                    {filterType === 'all' ? 'Semua' : filterType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredTransactions
                  .filter(t => t.paymentMethod === activeTab)
                  .filter(t => filterType === 'all' || t.type === filterType)
                  .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((transaction) => (
                    <div key={transaction.timestamp} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${transaction.type === 'income'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                          }`}>
                          {transaction.type === 'income'
                            ? <ArrowUpRight className="h-4 w-4" />
                            : <ArrowDownRight className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {transaction.type === 'income' ? '+' : '-'} Rp {transaction.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedCashManagement;