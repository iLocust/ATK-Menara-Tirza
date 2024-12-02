import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SalesChart = () => {
  const chartData = {
    series: [{
      name: 'Penjualan',
      data: [
        1500000, 2200000, 1800000, 2500000, 2100000, 2800000, 3200000,
        2900000, 3100000, 2700000, 3000000, 3500000, 3300000, 3800000,
        3400000, 3600000, 3200000, 3900000, 3700000, 4000000, 3800000,
        4200000, 4000000, 4300000, 4100000, 4400000, 4200000, 4500000,
        4300000, 4600000
      ]
    }],
    options: {
      chart: {
        type: 'area',
        height: 300,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      colors: ['#6366f1'], // Indigo color
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: [...Array(30)].map((_, i) => i + 1),
        title: {
          text: 'Tanggal'
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        title: {
          text: 'Penjualan (Rp)'
        },
        labels: {
          formatter: function(value) {
            return "Rp " + (value / 1000000).toFixed(1) + "M";
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(value) {
            return "Rp " + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Penjualan Harian</CardTitle>
        <p className="text-sm text-gray-500">Grafik penjualan harian bulan ini</p>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ReactApexChart 
            options={chartData.options}
            series={chartData.series}
            type="area"
            height={300}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;