import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Download,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet
} from 'lucide-react';
import SalesChart from './salesChart';

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('11');
  const [selectedYear, setSelectedYear] = useState('2024');

  // Sample data - replace with actual data from backend
  const monthlyData = {
    revenue: 45000000,
    expenses: 32000000,
    profit: 13000000,
    profitPercentage: 28.9,
    totalProducts: 250,
    topProducts: [
      { name: 'Buku Tulis', value: 150 },
      { name: 'Pulpen', value: 100 },
      { name: 'Seragam SD', value: 80 },
      { name: 'Pensil', value: 50 }
    ]
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Koperasi</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
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

          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Rp {monthlyData.revenue.toLocaleString()}
                </h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  12.5% dari bulan lalu
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
                  Rp {monthlyData.expenses.toLocaleString()}
                </h3>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  8.2% dari bulan lalu
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
                <p className="text-sm font-medium text-gray-500">Total Produk</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {monthlyData.totalProducts}
                </h3>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Package className="h-4 w-4 mr-1" />
                  15 produk baru
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Penjualan Harian */}
      <SalesChart />


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Laba Rugi</CardTitle>
            <p className="text-sm text-gray-500">
              Persentase laba: {monthlyData.profitPercentage}%
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendapatan</span>
                <span className="font-medium">Rp {monthlyData.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pengeluaran</span>
                <span className="font-medium">Rp {monthlyData.expenses.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Laba Bersih</span>
                  <span className="font-bold text-green-600">
                    Rp {monthlyData.profit.toLocaleString()}
                  </span>
                </div>
              </div>
              {/* Progress bar untuk visualisasi */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${monthlyData.profitPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Margin {monthlyData.profitPercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
            <p className="text-sm text-gray-500">Berdasarkan jumlah penjualan</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="text-gray-600">{product.value} terjual</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;