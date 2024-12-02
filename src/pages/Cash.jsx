import { useState, useEffect } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Search,
  ChevronDown, FilterX, ArrowDownWideNarrow,
  CreditCard, Printer
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

const UnifiedCashManagement = () => {
  // States
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
    expenses: { cash: [], transfer: [] },
    income: { cash: [], transfer: [] },
    totalExpense: { cash: 0, transfer: 0 },
    totalIncome: { cash: 0, transfer: 0 }
  });

  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });

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

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get balances
      const cashBalance = await cashFlowService.getCashBalance();
      const transferBalance = await cashFlowService.getTransferBalance();
      setBalance({ cash: cashBalance, transfer: transferBalance });

      // Get monthly summary
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const summary = await cashFlowService.getCashFlowSummary(start, end);

      // Process transactions
      const cashTransactions = summary.transactions.filter(t => t.paymentMethod === 'cash');
      const transferTransactions = summary.transactions.filter(t => t.paymentMethod === 'transfer');

      // Process daily balances
      const processDailyBalances = (transactions) => {
        // Create an array of all dates in the month
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const allDates = Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(selectedYear, selectedMonth - 1, i + 1);
          return date.toISOString().split('T')[0];
        });
      
        // Initialize daily transactions object with all dates
        const dailyTxns = allDates.reduce((acc, date) => {
          acc[date] = { income: 0, expense: 0, balance: 0 };
          return acc;
        }, {});
      
        // Add transaction data to corresponding dates
        transactions.forEach(curr => {
          const date = curr.date;
          if (curr.type === 'income') {
            dailyTxns[date].income += curr.amount;
          } else {
            dailyTxns[date].expense += curr.amount;
          }
          dailyTxns[date].balance = dailyTxns[date].income - dailyTxns[date].expense;
        });
      
        // Calculate running balance
        let runningBalance = 0;
        return Object.entries(dailyTxns)
          .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
          .map(([date, values]) => {
            runningBalance += values.balance;
            return {
              date,
              income: values.income,
              expense: values.expense,
              dailyBalance: values.balance,
              runningBalance
            };
          });
      };

      setMonthlyData({
        dailyBalance: {
          cash: processDailyBalances(cashTransactions),
          transfer: processDailyBalances(transferTransactions)
        },
        totalIncome: {
          cash: summary.cash.income,
          transfer: summary.transfer.income
        },
        totalExpense: {
          cash: summary.cash.expense,
          transfer: summary.transfer.expense
        },
        transactions: summary.transactions.sort((a, b) => b.timestamp - a.timestamp)
      });

      setTransactions(summary.transactions);
      setFilteredTransactions(summary.transactions);

    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
      console.error('Load data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const newTransaction = {
        ...formData,
        amount: parseInt(formData.amount.replace(/\./g, '')),
        timestamp: new Date().getTime()
      };

      await cashFlowService.addCashFlow(newTransaction);
      await loadData();

      setFormData({
        type: 'income',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash'
      });
      setIsDialogOpen(false);
    } catch (err) {
      setError('Gagal menambah transaksi: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Kas Koperasi</h1>
          <p className="text-gray-600 mt-1">
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            Cetak Laporan
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Tambah Transaksi</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Transaksi Kas</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 p-5">
                <div className="space-y-1.5 ">
                  <label className="text-sm text-gray-600 font-medium">Metode Pembayaran</label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="space-y-1.5">
                  <label className="text-sm text-gray-600 font-medium">Tanggal</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
            </DialogContent>          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas (Tunai)</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {balance.cash.toLocaleString()}</div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
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
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
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

      <div className="grid gap-6 md:grid-cols-12 mb-6">
        <div className="md:col-span-5">
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
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Rincian Saldo Harian ({activeTab === 'cash' ? 'Tunai' : 'Transfer'})</CardTitle>
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
                  {monthlyData.dailyBalance[activeTab].map((item) => (
                    <tr key={item.date} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(item.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
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
                      <td className="py-3 px-4 text-right font-medium">
                        Rp {item.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Riwayat Transaksi</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
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
                    {filterType === 'all' ? 'Semua' :
                      filterType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </Button>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="cash" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Tunai
                  </TabsTrigger>
                  <TabsTrigger value="transfer" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Transfer
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
                              year: 'numeric',
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
                {filteredTransactions.filter(t => t.paymentMethod === activeTab).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Tidak ada transaksi yang ditemukan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print-only summary section */}
      <div className="print-only mt-8" style={{ display: 'none' }}>
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-bold mb-2">Ringkasan:</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Pemasukan Tunai:</span>
              <span className="font-medium">Rp {monthlyData.totalIncome.cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pemasukan Transfer:</span>
              <span className="font-medium">Rp {monthlyData.totalIncome.transfer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pengeluaran Tunai:</span>
              <span className="font-medium">Rp {monthlyData.totalExpense.cash.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pengeluaran Transfer:</span>
              <span className="font-medium">Rp {monthlyData.totalExpense.transfer.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Saldo Akhir Tunai:</span>
                <span>Rp {(monthlyData.totalIncome.cash - monthlyData.totalExpense.cash).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Saldo Akhir Transfer:</span>
                <span>Rp {(monthlyData.totalIncome.transfer - monthlyData.totalExpense.transfer).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-500 text-center">
            <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCashManagement;