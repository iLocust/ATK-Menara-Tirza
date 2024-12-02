import { useState, useEffect } from 'react';
import { Printer, Wallet, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cashFlowService } from '@/lib/db/CashFlowService';

const MonthlyCashSummary = () => {
  const [monthlyData, setMonthlyData] = useState({
    dailyBalance: { cash: [], transfer: [] },
    expenses: { cash: [], transfer: [] },
    income: { cash: [], transfer: [] },
    totalExpense: { cash: 0, transfer: 0 },
    totalIncome: { cash: 0, transfer: 0 }
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('cash'); 
  const [isLoading, setIsLoading] = useState(true);

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
    loadMonthlyData();
  }, [selectedMonth, selectedYear]);

  const loadMonthlyData = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedYear, selectedMonth, 0);
      endDate.setHours(23, 59, 59, 999);
      
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const summary = await cashFlowService.getCashFlowSummary(start, end);

      // Process transactions by payment method
      const cashTransactions = summary.transactions.filter(t => t.paymentMethod === 'cash');
      const transferTransactions = summary.transactions.filter(t => t.paymentMethod === 'transfer');

      // Process daily balances for each payment method
      const processDailyBalances = (transactions) => {
        const dailyTxns = transactions.reduce((acc, curr) => {
          const date = new Date(curr.date);
          date.setHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];
          
          if (!acc[dateStr]) {
            acc[dateStr] = { income: 0, expense: 0, balance: 0 };
          }
          
          if (curr.type === 'income') {
            acc[dateStr].income += curr.amount;
          } else {
            acc[dateStr].expense += curr.amount;
          }
          
          acc[dateStr].balance = acc[dateStr].income - acc[dateStr].expense;
          return acc;
        }, {});

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

      // Process expenses and income for each payment method
      const processTransactions = (transactions, type) => 
        transactions
          .filter(t => t.type === type)
          .map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

      setMonthlyData({
        dailyBalance: {
          cash: processDailyBalances(cashTransactions),
          transfer: processDailyBalances(transferTransactions)
        },
        expenses: {
          cash: processTransactions(cashTransactions, 'expense'),
          transfer: processTransactions(transferTransactions, 'expense')
        },
        income: {
          cash: processTransactions(cashTransactions, 'income'),
          transfer: processTransactions(transferTransactions, 'income')
        },
        totalExpense: {
          cash: summary.cash.expense,
          transfer: summary.transfer.expense
        },
        totalIncome: {
          cash: summary.cash.income,
          transfer: summary.transfer.income
        }
      });
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Memuat data laporan...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { size: portrait; }
          body { padding: 20px; }
        }
      `}</style>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rincian Saldo Bulanan</h1>
            <p className="text-gray-600 mt-1">
              {selectedMonthName} {selectedYear}
            </p>
          </div>
          <Button onClick={handlePrint} className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            Cetak Laporan
          </Button>
        </div>

        <Card className="mb-6 no-print">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[200px]">
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
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="print-only text-center mb-4" style={{ display: 'none' }}>
          <h2 className="text-xl font-bold">Laporan Keuangan Koperasi</h2>
          <p>Periode: {selectedMonthName} {selectedYear}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tunai:</span>
                  <span className="text-lg font-semibold text-green-600">
                    Rp {monthlyData.totalIncome.cash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transfer:</span>
                  <span className="text-lg font-semibold text-green-600">
                    Rp {monthlyData.totalIncome.transfer.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tunai:</span>
                  <span className="text-lg font-semibold text-red-600">
                    Rp {monthlyData.totalExpense.cash.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transfer:</span>
                  <span className="text-lg font-semibold text-red-600">
                    Rp {monthlyData.totalExpense.transfer.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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

        <div className="grid gap-6 md:grid-cols-2">
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

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Rincian Pemasukan ({activeTab === 'cash' ? 'Tunai' : 'Transfer'})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="py-3 px-4 text-left font-medium">Tanggal</th>
                      <th className="py-3 px-4 text-left font-medium">Keterangan</th>
                      <th className="py-3 px-4 text-right font-medium">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.income[activeTab].map((income, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(income.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </td>
                        <td className="py-3 px-4">{income.description}</td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          Rp {income.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {monthlyData.income[activeTab].length === 0 && (
                     <tr>
                     <td colSpan="3" className="py-4 text-center text-gray-500">
                       Tidak ada pemasukan
                     </td>
                   </tr>
                 )}
                 <tr className="bg-gray-50 font-bold">
                   <td colSpan="2" className="py-3 px-4">Total Pemasukan</td>
                   <td className="py-3 px-4 text-right text-green-600">
                     Rp {monthlyData.totalIncome[activeTab].toLocaleString()}
                   </td>
                 </tr>
               </tbody>
             </table>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="border-b">
             <CardTitle>Rincian Pengeluaran ({activeTab === 'cash' ? 'Tunai' : 'Transfer'})</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
             <table className="w-full">
               <thead>
                 <tr className="border-b bg-gray-50">
                   <th className="py-3 px-4 text-left font-medium">Tanggal</th>
                   <th className="py-3 px-4 text-left font-medium">Keterangan</th>
                   <th className="py-3 px-4 text-right font-medium">Jumlah</th>
                 </tr>
               </thead>
               <tbody>
                 {monthlyData.expenses[activeTab].map((expense, index) => (
                   <tr key={index} className="border-b hover:bg-gray-50">
                     <td className="py-3 px-4">
                       {new Date(expense.date).toLocaleDateString('id-ID', {
                         day: 'numeric',
                         month: 'short'
                       })}
                     </td>
                     <td className="py-3 px-4">{expense.description}</td>
                     <td className="py-3 px-4 text-right font-medium text-red-600">
                       Rp {expense.amount.toLocaleString()}
                     </td>
                   </tr>
                 ))}
                 {monthlyData.expenses[activeTab].length === 0 && (
                   <tr>
                     <td colSpan="3" className="py-4 text-center text-gray-500">
                       Tidak ada pengeluaran
                     </td>
                   </tr>
                 )}
                 <tr className="bg-gray-50 font-bold">
                   <td colSpan="2" className="py-3 px-4">Total Pengeluaran</td>
                   <td className="py-3 px-4 text-right text-red-600">
                     Rp {monthlyData.totalExpense[activeTab].toLocaleString()}
                   </td>
                 </tr>
               </tbody>
             </table>
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
 </>
);
};

export default MonthlyCashSummary;
                        