/* eslint-disable react/prop-types */
import  { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Wallet,
  LineChart as ChartIcon
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Make sure these paths match your project structure
import { cashFlowService } from '@/lib/db/CashFlowService';
import { stockService } from '@/lib/db/StockService';
import { productService } from '@/lib/db/ProductService';

const SalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartIcon className="h-5 w-5" />
            Grafik Keuangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartIcon className="h-5 w-5" />
          Grafik Keuangan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                name="Pemasukan"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                name="Pengeluaran"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
const ProfitAnalysis = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle>Analisis Laba Rugi</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Margin Laba</span>
          <span className="text-lg font-semibold">
            {((data.profit / data.revenue) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${(data.profit / data.revenue) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <p className="text-sm text-gray-500">Laba Kotor</p>
            <p className="text-lg font-semibold">Rp {data.profit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Proyeksi Tahunan</p>
            <p className="text-lg font-semibold">Rp {(data.profit * 12).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const InventoryMetrics = ({ data }) => {
  // Calculate value trends
  const calculateTrend = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Analisis Inventaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Performa Produk</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-sm">
                  <span>Produk Aktif</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    {calculateTrend(data.inStock, data.totalProducts)}%
                  </span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${(data.inStock / data.totalProducts) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-sm">
                  <span>Perlu Restock</span>
                  <span className="flex items-center gap-1 text-yellow-600">
                    <ArrowUpRight className="h-4 w-4" />
                    {calculateTrend(data.lowStock.length, data.totalProducts)}%
                  </span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-yellow-500 rounded-full"
                    style={{ width: `${(data.lowStock.length / data.totalProducts) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-sm">
                  <span>Stok Habis</span>
                  <span className="flex items-center gap-1 text-red-600">
                    <ArrowDownRight className="h-4 w-4" />
                    {calculateTrend(data.outOfStock.length, data.totalProducts)}%
                  </span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-red-500 rounded-full"
                    style={{ width: `${(data.outOfStock.length / data.totalProducts) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Distribusi Kategori</h4>
            <div className="space-y-3">
              {data.categories.map(category => (
                <div key={category.name}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="truncate">{category.name}</span>
                    <span className="font-medium">{calculateTrend(category.count, data.totalProducts)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${(category.count / data.totalProducts) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Ringkasan Inventaris</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600">Total Produk</p>
              <p className="text-lg font-semibold">{data.totalProducts}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-600">Kategori</p>
              <p className="text-lg font-semibold">{data.categories.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Rata-rata Stok</p>
              <p className="text-lg font-semibold">
                {Math.round(data.inStock / data.categories.length)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FinancialInsights = ({ data }) => {
  const formatPercentage = (value) => value.toFixed(1) + '%';
  const formatCurrency = (value) => `Rp ${value.toLocaleString()}`;
  
  const calculateComposition = (cash, transfer) => {
    const total = cash + transfer;
    return {
      cash: total ? (cash / total) * 100 : 0,
      transfer: total ? (transfer / total) * 100 : 0
    };
  };

  const balanceComposition = calculateComposition(
    data.balance.cash,
    data.balance.transfer
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Komposisi Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Tunai</span>
              <div className="text-right">
                <span className="text-sm font-medium block">{formatPercentage(balanceComposition.cash)}</span>
                <span className="text-xs text-gray-500">{formatCurrency(data.balance.cash)}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-500 rounded-full" 
                style={{ width: `${balanceComposition.cash}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Transfer</span>
              <div className="text-right">
                <span className="text-sm font-medium block">{formatPercentage(balanceComposition.transfer)}</span>
                <span className="text-xs text-gray-500">{formatCurrency(data.balance.transfer)}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-indigo-500 rounded-full" 
                style={{ width: `${balanceComposition.transfer}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Saldo</span>
              <span className="text-sm font-semibold">
                {formatCurrency(data.balance.cash + data.balance.transfer)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    balance: { cash: 0, transfer: 0 },
    comparison: {
      combined: {
        incomeChange: 0,
        expenseChange: 0,
        balanceChange: 0
      }
    },
    inventory: {
      outOfStock: [],
      lowStock: [],
      totalProducts: 0,
      categories: [],
      inStock: 0
    },
    chartData: []
  });

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
   
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${lastDay}`;
   
      const [
        monthlyStats,
        cashFlowSummary,
        monthlyComparison, 
        lowStockProducts,
        outOfStockProducts,
        products
      ] = await Promise.all([
        cashFlowService.getMonthlyStatistics(selectedYear, selectedMonth),
        cashFlowService.getCashFlowSummary(startDate, endDate),
        cashFlowService.getComparison(selectedYear, selectedMonth),
        stockService.getLowStockProducts(10),
        stockService.getOutOfStockProducts(),
        productService.getAllProducts()
      ]);
   
      // Calculate categories first
      const categories = products.reduce((acc, product) => {
        const category = acc.find(c => c.name === product.kategori);
        if (category) {
          category.count++;
        } else {
          acc.push({ name: product.kategori, count: 1 });
        }
        return acc;
      }, []);
   
      setDashboardData({
        revenue: monthlyStats?.combined?.totalIncome / 2 || 0,
        expenses: monthlyStats?.combined?.totalExpense / 2 || 0,
        profit: monthlyStats?.combined?.netFlow / 2 || 0,
        balance: {
          cash: monthlyStats?.cash?.initialBalance / 2 || 0,
          transfer: monthlyStats?.transfer?.initialBalance / 2 || 0
        },
        comparison: monthlyComparison || {
          combined: {
            incomeChange: 0,
            expenseChange: 0,
            balanceChange: 0
          }
        },
        inventory: {
          outOfStock: outOfStockProducts || [],
          lowStock: lowStockProducts || [],
          totalProducts: products?.length || 0,
          categories,
          inStock: products.filter(p => p.stock > 10).length
        },
        chartData: cashFlowSummary?.dailyBalance?.cash.map(day => ({
          date: new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          income: day.income / 2 || 0,
          expense: day.expense / 2 || 0
        }))
      });
    } catch (err) {
      console.error('LoadData Error:', err);  
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
   };

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
  }));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-white font-sans">Dashboard Keuangan</h1>        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
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
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2023, 2022].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Rp {dashboardData.revenue.toLocaleString()}
                </h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {dashboardData.comparison.combined.incomeChange.toFixed(1)}% dari bulan lalu
                </p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Rp {dashboardData.expenses.toLocaleString()}
                </h3>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  {dashboardData.comparison.combined.expenseChange.toFixed(1)}% dari bulan lalu
                </p>
              </div>
              <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo Total</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Rp {(dashboardData.balance.cash + dashboardData.balance.transfer).toLocaleString()}
                </h3>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Wallet className="h-4 w-4 mr-1" />
                  {dashboardData.comparison.combined.balanceChange.toFixed(1)}% dari bulan lalu
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfitAnalysis data={dashboardData} />
        <FinancialInsights data={dashboardData} />
      </div>

      <SalesChart data={dashboardData.chartData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InventoryMetrics data={dashboardData.inventory} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Status Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.inventory.outOfStock.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {dashboardData.inventory.outOfStock.length} produk habis stok
                  </AlertDescription>
                </Alert>
              )}
              {dashboardData.inventory.lowStock.length > 0 && (
                <Alert>
                  <AlertDescription>
                    {dashboardData.inventory.lowStock.length} produk stok menipis
                  </AlertDescription>
                </Alert>
              )}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Produk Perlu Perhatian:</h4>
                <div className="space-y-2">
                  {[...dashboardData.inventory.outOfStock, ...dashboardData.inventory.lowStock]
                    .slice(0, 5)
                    .map(product => (
                      <div key={product.name} className="flex justify-between items-center">
                        <span>{product.name}</span>
                        <span className={`font-medium ${
                          product.stock === 0 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {product.stock} unit
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;