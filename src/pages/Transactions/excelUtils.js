import ExcelJS from 'exceljs';

const exportSalesReport = async (dailyGroups) => {
    const workbook = new ExcelJS.Workbook();
    const dateParts = dailyGroups[0].date.split('/');
    const monthNumber = dateParts[1];  // Get the month part
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = months[parseInt(monthNumber) - 1];  // Adjust for 0-based array
    
    const worksheet = workbook.addWorksheet(`Penjualan - ${monthName}`);
    let currentRow = 1;
    
    for (const dayData of dailyGroups) {
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `Penjualan Per ${dayData.date}`;
      worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 15 };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      
      currentRow++;
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['Nama Produk', 'Kategori', 'Jumlah', 'Harga', 'Penjualan', 'Subtotal', 'Metode'];
      headerRow.font = { bold: true };
      headerRow.eachCell((cell, colNumber) => {
        if (colNumber === 1) {
          cell.alignment = { horizontal: 'left' };
        } else {
          cell.alignment = { horizontal: 'center' };
        }
      });
  
      currentRow++;
      let totalQty = 0;
      let totalPrice = 0;
      let totalSales = 0;
      let totalSubtotal = 0;
      
      dayData.transactions.forEach(transaction => {
        const startRow = currentRow;
        transaction.items.forEach((item, idx) => {
          const row = worksheet.getRow(currentRow);
          row.values = [
            item.name,
            item.kategori,
            item.quantity,
            item.price,
            item.price * item.quantity,
            '', 
            ''
          ];
  
          totalQty += item.quantity;
          totalPrice += item.price;
          totalSales += (item.price * item.quantity);
  
          row.getCell('A').alignment = { horizontal: 'left' };
          ['B', 'C', 'D', 'E'].forEach(col => {
            const cell = row.getCell(col);
            cell.numFmt = '#,##0';
            cell.alignment = { horizontal: 'center' };
          });
  
          if (item.kategori.toLowerCase().includes('seragam')) {
            row.getCell('B').fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' }
            };
          }
          currentRow++;
        });
  
        if (transaction.items.length > 1) {
          worksheet.mergeCells(`F${startRow}:F${currentRow - 1}`);
          worksheet.mergeCells(`G${startRow}:G${currentRow - 1}`);
        }
        
        worksheet.getCell(`F${startRow}`).value = transaction.total;
        worksheet.getCell(`F${startRow}`).numFmt = '#,##0';
        worksheet.getCell(`F${startRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
        
        totalSubtotal += transaction.total;

        worksheet.getCell(`G${startRow}`).value = transaction.paymentMethod;
        worksheet.getCell(`G${startRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
        
        if (transaction.paymentMethod.toLowerCase() === 'transfer') {
          worksheet.getCell(`G${startRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF9900' }
          };
        }
      });
  
      const totalRow = worksheet.getRow(currentRow);
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Grand Total';
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9900' }
      };
      
      totalRow.getCell('C').value = totalQty;
      totalRow.getCell('D').value = totalPrice;
      totalRow.getCell('E').value = totalSales;
      totalRow.getCell('F').value = totalSubtotal;

      const transactionCount = dayData.transactions.length;
      totalRow.getCell('G').value = `${transactionCount} Transaksi`;
      
      totalRow.font = { bold: true };
      ['C', 'D', 'E', 'F', 'G'].forEach(col => {
        totalRow.getCell(col).numFmt = '#,##0';
        totalRow.getCell(col).alignment = { horizontal: 'center' };
      });
      
      currentRow++;
  
      ['Tunai', 'Transfer', `GrandTotal pendapatan ${dayData.date}`].forEach((label, idx) => {
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const row = worksheet.getRow(currentRow);
        row.getCell('A').value = label;
        row.getCell('A').alignment = { horizontal: 'center' };
        
        const value = idx === 0 ? dayData.paymentSummary.cash :
                     idx === 1 ? dayData.paymentSummary.transfer :
                     dayData.dailyTotal;
                     
        row.getCell('G').value = value;
        row.getCell('G').numFmt = '#,##0';
        row.getCell('G').alignment = { horizontal: 'center' };
        
        if (idx === 1) {
          row.getCell('A').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF9900' }
          };
        }
        
        row.font = { bold: true };
        currentRow++;
      });
  
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= currentRow) {
          row.eachCell({ includeEmpty: true }, cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      worksheet.columns = [
        { width: 35 }, { width: 10 }, { width: 10 }, 
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
      ];
      
      currentRow += 3;
    }
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Penjualan_${new Date().toLocaleDateString('id-ID')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};

const exportCombinedReport = async (transactions) => {
  if (!transactions?.length) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Penjualan');
  
  const dates = transactions.map(t => new Date(t.date));
  const startDate = new Date(Math.min(...dates));
  const endDate = new Date(Math.max(...dates));
  const dateRange = `PerTgl ${startDate.getDate()} - ${endDate.getDate()} /${(startDate.getMonth() + 1).toString().padStart(2, '0')}/${startDate.getFullYear()}`;

  // Headers
  worksheet.mergeCells('A1:I1');
  worksheet.mergeCells('J1:R1');
  worksheet.getCell('A1').value = `Penjualan Seragam ${dateRange}`;
  worksheet.getCell('J1').value = `Penjualan ATK ${dateRange}`;
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).alignment = { horizontal: 'center' };

  const headers = ['Nama Produk', 'Kategori', 'Jumlah Produk', 'Harga Produk', 'Penjualan Kotor', 'Subtotal', 'Total', 'Metode Pembayaran', 'Pembayaran'];
  worksheet.getRow(3).values = [...headers, ...headers];
  worksheet.getRow(3).font = { bold: true };
  worksheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(3).height = 30;

  const seragamTransactions = transactions.map(t => ({
    items: t.items.filter(item => item.kategori.toLowerCase().includes('seragam')),
    paymentMethod: t.paymentMethod,
    total: t.items
      .filter(item => item.kategori.toLowerCase().includes('seragam'))
      .reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
  })).filter(t => t.items.length > 0);

  const atkTransactions = transactions.map(t => ({
    items: t.items.filter(item => !item.kategori.toLowerCase().includes('seragam')),
    paymentMethod: t.paymentMethod,
    total: t.items
      .filter(item => !item.kategori.toLowerCase().includes('seragam'))
      .reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
  })).filter(t => t.items.length > 0);

  let currentRow = 4;

  const writeTransactions = (transactions, startCol, totals) => {
    let row = currentRow;
    transactions.forEach(transaction => {
      const startRow = row;
      
      transaction.items.forEach(item => {
        const values = [
          item.name,
          item.kategori,
          item.quantity,
          item.price,
          item.price * item.quantity,
          transaction.total,
          transaction.total,
          transaction.paymentMethod,
          transaction.total
        ];
        
        values.forEach((value, colIdx) => {
          const cell = worksheet.getRow(row).getCell(startCol + colIdx + 1);
          cell.value = value;
          cell.alignment = colIdx === 0 ? { horizontal: 'left' } : { horizontal: 'center' };
          if ([2, 3, 4, 5, 6, 8].includes(colIdx)) {
            cell.numFmt = '#,##0';
          }

          if (colIdx === 1 && item.kategori.toLowerCase().includes('seragam')) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' }
            };
          }

          if (colIdx === 7 && transaction.paymentMethod.toLowerCase() === 'transfer') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF9900' }
            };
          }
        });
        row++;
      });

      if (transaction.items.length > 0) {
        [5, 6, 7, 8].forEach(colIdx => {
          if (startRow < row - 1) {
            worksheet.mergeCells(startRow, startCol + colIdx + 1, row - 1, startCol + colIdx + 1);
          }
        });
      }

      const method = transaction.paymentMethod.toLowerCase();
      if (method === 'transfer') {
        totals.transfer += transaction.total;
      } else if (method === 'cash' || method === 'tunai') {
        totals.tunai += transaction.total;
      }
    });
    return row;
  };

  const seragamTotals = { transfer: 0, tunai: 0 };
  const atkTotals = { transfer: 0, tunai: 0 };
  
  const maxRow = Math.max(
    writeTransactions(seragamTransactions, 0, seragamTotals),
    writeTransactions(atkTransactions, 9, atkTotals)
  );
  
  currentRow = maxRow + 1;

  const writeTotals = (startCol, totals, prefix) => {
    const rows = [
      [`Total Dana ${prefix} di Transfer`, totals.transfer],
      [`Total Dana ${prefix} Tunai`, totals.tunai],
      [`Total Dana ${prefix} Seluruhnya`, totals.transfer + totals.tunai]
    ];

    rows.forEach(([label, value]) => {
      worksheet.mergeCells(currentRow, startCol + 1, currentRow, startCol + 8);
      const labelCell = worksheet.getRow(currentRow).getCell(startCol + 1);
      const valueCell = worksheet.getRow(currentRow).getCell(startCol + 9);
      
      labelCell.value = label;
      labelCell.alignment = { horizontal: 'left' };
      valueCell.value = value;
      valueCell.numFmt = '#,##0';
      
      worksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
    });
  };

  writeTotals(0, seragamTotals, 'Seragam');
  currentRow -= 3;
  writeTotals(9, atkTotals, 'ATK');

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  const columnWidth = [30, 10, 10, 10, 10, 10, 10, 15, 10];
  worksheet.columns = [...columnWidth, ...columnWidth].map(width => ({ width }));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Penjualan_${startDate.toLocaleDateString('id-ID')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const exportCashFlow = async (monthlyData, selectedMonth, selectedYear) => {
  if (!monthlyData?.dailyBalance) return;
  const workbook = new ExcelJS.Workbook();
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const worksheet = workbook.addWorksheet(`${months[selectedMonth-1]} ${selectedYear}`);
  


  // Title
  worksheet.mergeCells('A1:C1');
  worksheet.getCell('A1').value = `Rekap Kas Bulanan - ${months[selectedMonth-1]} ${selectedYear}`;
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  let currentRow = 3;

  // Previous Month's Balance calculation
  const prevMonthLastDay = new Date(selectedYear, selectedMonth - 1, 0);
  const initialCashBalance = monthlyData.dailyBalance?.cash[0]?.runningBalance - 
                           (monthlyData.dailyBalance?.cash[0]?.income || 0) + 
                           (monthlyData.dailyBalance?.cash[0]?.expense || 0);

  // Income Section Title
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'Pendapatan Harian';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).eachCell({ includeEmpty: true }, cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2F0D9' }
    };
  });
  currentRow++;

  // Income Headers
  const incomeHeaders = ['Tanggal', 'Pendapatan', 'Total'];
  worksheet.getRow(currentRow).values = incomeHeaders;
  worksheet.getRow(currentRow).font = { bold: true };
  currentRow++;

  const startIncomeRow = currentRow;

  // Previous month balance row
  worksheet.getRow(currentRow).values = [
    `Saldo ${months[prevMonthLastDay.getMonth()]} ${prevMonthLastDay.getFullYear()}`,
    initialCashBalance || 0
  ];
  worksheet.getRow(currentRow).font = { bold: true };
  worksheet.getRow(currentRow).eachCell({ includeEmpty: true }, cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' }
    };
  });
  worksheet.getCell(`B${currentRow}`).numFmt = '#,##0';
  currentRow++;

  // Filter transactions for current month only
  const currentMonthTransactions = monthlyData.dailyBalance.cash
    .filter(day => {
      const date = new Date(day.date);
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
    });

  // Daily income records
  currentMonthTransactions.forEach(day => {
    const row = worksheet.getRow(currentRow);
    
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const dailyIncome = day.income || 0;

    row.values = [formattedDate, dailyIncome];
    row.getCell(2).numFmt = '#,##0';
    currentRow++;
  });

  // Calculate total (previous month balance + current month income)
  const monthlyIncomeTotal = currentMonthTransactions.reduce((sum, day) => sum + (day.income || 0), 0);
  const totalIncome = initialCashBalance + monthlyIncomeTotal;

  // Merge income total column for all rows including previous month balance
  worksheet.mergeCells(startIncomeRow, 3, currentRow - 1, 3);
  worksheet.getCell(startIncomeRow, 3).value = totalIncome;
  worksheet.getCell(startIncomeRow, 3).numFmt = '#,##0';
  worksheet.getCell(startIncomeRow, 3).alignment = { vertical: 'middle', horizontal: 'center' };

  currentRow += 2;

  // Expense Section Title
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'Pengeluaran';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).eachCell({ includeEmpty: true }, cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFDE9D9' }
    };
  });
  currentRow++;

  // Expense Headers
  const expenseHeaders = ['Keterangan', 'Jumlah', 'Total'];
  worksheet.getRow(currentRow).values = expenseHeaders;
  worksheet.getRow(currentRow).font = { bold: true };
  currentRow++;

  const startExpenseRow = currentRow;

  // Get all expense transactions for the month
  const monthlyExpenses = monthlyData.transactions
    .filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === selectedYear && 
             date.getMonth() + 1 === selectedMonth &&
             t.type === 'expense' &&
             t.paymentMethod === 'cash';
    });

  // Sort expenses by date
  monthlyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Expense records by description
  monthlyExpenses.forEach(transaction => {
    const row = worksheet.getRow(currentRow);
    row.values = [transaction.description, transaction.amount];
    row.getCell(2).numFmt = '#,##0';
    currentRow++;
  });

  // Calculate monthly expense total
  const monthlyExpenseTotal = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Merge expense total column
  if (startExpenseRow < currentRow) {
    worksheet.mergeCells(startExpenseRow, 3, currentRow - 1, 3);
    worksheet.getCell(startExpenseRow, 3).value = monthlyExpenseTotal;
    worksheet.getCell(startExpenseRow, 3).numFmt = '#,##0';
    worksheet.getCell(startExpenseRow, 3).alignment = { vertical: 'middle', horizontal: 'center' };
  }

  currentRow += 2;

  // Summary Section
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'Ringkasan';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).eachCell({ includeEmpty: true }, cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB4C6E7' }
    };
  });
  currentRow++;

  const summaryData = [
    ['Total Pendapatan', monthlyIncomeTotal],
    ['Total Pengeluaran', monthlyExpenseTotal],
    ['Saldo Akhir', totalIncome - monthlyExpenseTotal]
  ];

  summaryData.forEach(([label, value]) => {
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`C${currentRow}`).value = value;
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0';
    worksheet.getRow(currentRow).font = { bold: true };
    
    if (label === 'Saldo Akhir') {
      worksheet.getRow(currentRow).eachCell({ includeEmpty: true }, cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' }
        };
      });
    }
    currentRow++;
  });

  // Style the worksheet
  worksheet.columns = [
    { width: 40 }, // Description/Date
    { width: 20 }, // Amount
    { width: 20 }, // Total
  ];

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    // Left align first column
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Kas_${months[selectedMonth-1]}_${selectedYear}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const exportStock = async (stock) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Daftar Stok');

  // Title
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `Laporan Stok - ${new Date().toLocaleDateString('id-ID')}`;
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Headers
  const headers = [
    'Kategori',
    'Produk',
    'Sisa Stok',
    'Harga Beli',
    'Harga Jual',
    'Margin (%)',
    'Barcode',
    'Tanggal Masuk'
  ];

  worksheet.getRow(3).values = headers;
  worksheet.getRow(3).font = { bold: true };
  worksheet.getRow(3).alignment = { horizontal: 'center' };

  let currentRow = 4;

  // Data rows
  stock.forEach((item) => {
    const row = worksheet.getRow(currentRow);
    row.values = [
      item.kategori,
      item.produk,
      item.sisaStok,
      item.hargaBeli,
      item.hargaJual,
      item.margin,
      item.barcode,
      new Date(item.tanggalMasuk).toLocaleDateString('id-ID')
    ];

    // Formatting
    row.getCell(1).alignment = { horizontal: 'left' };
    row.getCell(2).alignment = { horizontal: 'left' };
    ['C', 'D', 'E', 'F'].forEach(col => {
      row.getCell(col).numFmt = '#,##0';
      row.getCell(col).alignment = { horizontal: 'right' };
    });
    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(8).alignment = { horizontal: 'center' };

    // Highlight seragam category
    if (item.kategori.toLowerCase().includes('seragam')) {
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }
      };
    }

    currentRow++;
  });

  // Summary section
  currentRow += 2;
  const totalStock = stock.reduce((sum, item) => sum + item.sisaStok, 0);
  const totalValue = stock.reduce((sum, item) => sum + (item.hargaBeli * item.sisaStok), 0);
  
  const summaryData = [
    ['Total Jenis Produk', stock.length],
    ['Total Unit Stok', totalStock],
    ['Total Nilai Stok', totalValue],
  ];

  worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'Ringkasan';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`A${currentRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB4C6E7' }
  };
  currentRow++;

  summaryData.forEach(([label, value]) => {
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`H${currentRow}`).value = value;
    worksheet.getCell(`H${currentRow}`).numFmt = '#,##0';
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;
  });

  // Set column widths
  worksheet.columns = [
    { width: 15 },  // Kategori
    { width: 35 },  // Produk
    { width: 12 },  // Sisa Stok
    { width: 15 },  // Harga Beli
    { width: 15 },  // Harga Jual
    { width: 12 },  // Margin
    { width: 15 },  // Barcode
    { width: 15 },  // Tanggal Masuk
  ];

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Stok_${new Date().toLocaleDateString('id-ID')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

const importStock = async (file) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);
    
    const worksheet = workbook.getWorksheet('Daftar Stok');
    if (!worksheet) {
      throw new Error('Format file tidak valid. Worksheet "Daftar Stok" tidak ditemukan.');
    }

    // Skip header rows (title and column headers)
    const dataRows = [];
    let foundSummarySection = false;

    worksheet.eachRow((row, rowNumber) => {
      // Skip the first 3 rows (title and headers)
      if (rowNumber <= 3) return;

      const rowValues = row.values;
      // Check if we've reached the summary section
      if (rowValues[1] === 'Ringkasan') {
        foundSummarySection = true;
        return;
      }

      if (!foundSummarySection && rowValues.length > 1) {
        const [_, kategori, produk, sisaStok, hargaBeli, hargaJual, margin, barcode, tanggalMasuk] = rowValues;

        // Skip rows with missing required data
        if (!kategori || !produk || !sisaStok || !hargaBeli || !hargaJual) return;

        dataRows.push({
          kategori: kategori.toString(),
          produk: produk.toString(),
          sisaStok: parseInt(sisaStok) || 0,
          hargaBeli: parseInt(hargaBeli) || 0,
          hargaJual: parseInt(hargaJual) || 0,
          margin: parseFloat(margin) || 0,
          barcode: barcode ? barcode.toString() : '',
          tanggalMasuk: new Date().toISOString().split('T')[0], // Always use current date for imports
          isImported: true // Add flag to mark as imported data
        });
      }
    });

    // Validate the data
    for (const row of dataRows) {
      if (!['ATK', 'Seragam'].includes(row.kategori)) {
        throw new Error(`Kategori tidak valid: ${row.kategori}. Harus 'ATK' atau 'Seragam'`);
      }

      if (row.sisaStok < 0) {
        throw new Error(`Stok tidak valid untuk produk ${row.produk}: ${row.sisaStok}`);
      }

      if (row.hargaBeli <= 0 || row.hargaJual <= 0) {
        throw new Error(`Harga tidak valid untuk produk ${row.produk}`);
      }

      if (row.margin < 0) {
        throw new Error(`Margin tidak valid untuk produk ${row.produk}: ${row.margin}`);
      }

      if (row.barcode && !/^\d{8,13}$/.test(row.barcode)) {
        throw new Error(`Format barcode tidak valid untuk produk ${row.produk}: ${row.barcode}`);
      }
    }

    return dataRows;
  } catch (error) {
    throw new Error(`Gagal mengimpor data: ${error.message}`);
  }
};
// Update the exports at the bottom of excelUtils.js
export { exportSalesReport, exportCombinedReport, exportCashFlow, exportStock, importStock };