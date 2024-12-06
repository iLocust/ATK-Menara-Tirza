// CashFlowService.js
import { dbService } from './db-service';

class CashFlowService {
  // Base methods for getting all cash flows
  async getAllCashFlow() {
    const cashFlows = await dbService.getAll('cashFlow');
    const transferFlows = await dbService.getAll('transferFlow');
    return [...cashFlows, ...transferFlows];
  }

  async getCashOnlyFlow() {
    return dbService.getAll('cashFlow');
  }

  async getTransferOnlyFlow() {
    return dbService.getAll('transferFlow');
  }

  // Monthly balance management
  async updateMonthlyBalance(date) {
    const transactionDate = new Date(date);
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth() + 1;
    
    // Update balance untuk bulan ini
    await this.updateBalanceForMonth(year, month);
    
    // Update balance untuk bulan-bulan berikutnya
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Jika transaksi di masa lalu, update semua bulan sampai bulan sekarang
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      for (let y = year; y <= currentYear; y++) {
        const startMonth = y === year ? month + 1 : 1;
        const endMonth = y === currentYear ? currentMonth : 12;
        
        for (let m = startMonth; m <= endMonth; m++) {
          await this.updateBalanceForMonth(y, m);
        }
      }
    }
  }

  async updateBalanceForMonth(year, month) {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Get date range for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
    // Get previous month's balance
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousMonthBalance = await this.getLastMonthBalance(previousYear, previousMonth);
  
    // Get all transactions and flows for this month
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    const cashFlows = await this.getCashFlowByDateRange(startDate, endDate);
  
    // Calculate totals for cash transactions
    const cashTransactions = transactions.filter(t => t.paymentMethod === 'cash');
    const cashFlowsThisMonth = cashFlows.filter(f => f.paymentMethod === 'cash' && !f.transactionId);
  
    // Calculate totals for transfer transactions
    const transferTransactions = transactions.filter(t => t.paymentMethod === 'transfer');
    const transferFlowsThisMonth = cashFlows.filter(f => f.paymentMethod === 'transfer' && !f.transactionId);
  
    // Calculate cash income and expenses
    const cashIncome = cashTransactions.reduce((sum, t) => sum + t.total, 0) +
      cashFlowsThisMonth
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0);
  
    const cashExpense = cashFlowsThisMonth
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  
    // Calculate transfer income and expenses
    const transferIncome = transferTransactions.reduce((sum, t) => sum + t.total, 0) +
      transferFlowsThisMonth
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0);
  
    const transferExpense = transferFlowsThisMonth
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  
    // Calculate final balances
    const monthCashBalance = previousMonthBalance.cashBalance + cashIncome - cashExpense;
    const monthTransferBalance = previousMonthBalance.transferBalance + transferIncome - transferExpense;
  
    // Update or create balance record
    const balances = await dbService.getAllFromIndex('monthlyBalance', 'monthKey', monthKey);
  
    const balanceRecord = {
      monthKey,
      cashBalance: monthCashBalance,
      transferBalance: monthTransferBalance,
      cashIncome,
      cashExpense,
      transferIncome,
      transferExpense,
      timestamp: new Date().getTime()
    };
  
    if (balances.length > 0) {
      await dbService.put('monthlyBalance', {
        ...balances[0],
        ...balanceRecord
      });
    } else {
      await dbService.add('monthlyBalance', balanceRecord);
    }
  
    return balanceRecord;
  }

  async getMonthlyTotals(year, month) {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const balances = await dbService.getAllFromIndex('monthlyBalance', 'monthKey', monthKey);
    
    if (balances.length > 0) {
      const balance = balances[0];
      return {
        cash: {
          income: balance.cashIncome || 0,
          expense: balance.cashExpense || 0,
          balance: balance.cashBalance || 0
        },
        transfer: {
          income: balance.transferIncome || 0,
          expense: balance.transferExpense || 0,
          balance: balance.transferBalance || 0
        },
        total: {
          income: (balance.cashIncome || 0) + (balance.transferIncome || 0),
          expense: (balance.cashExpense || 0) + (balance.transferExpense || 0),
          balance: (balance.cashBalance || 0) + (balance.transferBalance || 0)
        }
      };
    }
    
    return {
      cash: { income: 0, expense: 0, balance: 0 },
      transfer: { income: 0, expense: 0, balance: 0 },
      total: { income: 0, expense: 0, balance: 0 }
    };
  }
  
  async getLastMonthBalance(year, month) {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const balances = await dbService.getAllFromIndex('monthlyBalance', 'monthKey', monthKey);
    
    if (balances.length > 0) {
      return balances[0];
    }

    // If no balance exists for the requested month, recursively get the previous month
    // until we find a balance or reach January 2020 (or your preferred starting point)
    if (year > 2020 || (year === 2020 && month > 1)) {
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;
      return this.getLastMonthBalance(previousYear, previousMonth);
    }

    // If we reach here, return zero balances
    return { cashBalance: 0, transferBalance: 0 };
  }

  // Transaction and cash flow management
  async addCashFlow(data) {
    const baseData = {
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().getTime()
    };
  
    const result = await dbService.add('cashFlow', baseData);
    await this.updateMonthlyBalance(baseData.date);
    return result;
  }

  async getCashFlowByType(type) {
    const cashFlows = await dbService.getAllFromIndex('cashFlow', 'type', type);
    const transferFlows = await dbService.getAllFromIndex('transferFlow', 'type', type);
    return [...cashFlows, ...transferFlows];
  }

  async getCashFlowByDateRange(startDate, endDate) {
    const flowData = await this.getAllCashFlow();
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return flowData.filter(flow => {
      const flowDate = new Date(flow.date);
      return flowDate >= start && flowDate <= end;
    });
  }

  async getTransactionsByDateRange(startDate, endDate) {
    const transactions = await dbService.getAll('transaksi');
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return transactions.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= start && txnDate <= end;
    });
  }

  async getCashFlowByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const flowData = await this.getAllCashFlow();
    return flowData.filter(flow => {
      const flowDate = new Date(flow.date);
      return flowDate >= startDate && flowDate <= endDate;
    });
  }

  // Balance calculations
  async getCashBalance() {
    const transactions = await dbService.getAll('transaksi');
    const cashFlows = await this.getCashOnlyFlow();
    
    const cashTransactions = transactions.filter(t => t.paymentMethod === 'cash');
    const nonTxnFlows = cashFlows.filter(f => !f.transactionId);
    
    const transactionTotal = cashTransactions.reduce((sum, t) => sum + t.total, 0);
    const nonTxnTotal = nonTxnFlows.reduce((sum, flow) => 
      sum + (flow.type === 'income' ? flow.amount : -flow.amount), 0);
    
    return transactionTotal + nonTxnTotal;
  }

  async getTransferBalance() {
    const transactions = await dbService.getAll('transaksi');
    const transferFlows = await this.getTransferOnlyFlow();
    
    const transferTransactions = transactions.filter(t => t.paymentMethod === 'transfer');
    const nonTxnFlows = transferFlows.filter(f => !f.transactionId);
    
    const transactionTotal = transferTransactions.reduce((sum, t) => sum + t.total, 0);
    const nonTxnTotal = nonTxnFlows.reduce((sum, flow) => 
      sum + (flow.type === 'income' ? flow.amount : -flow.amount), 0);
    
    return transactionTotal + nonTxnTotal;
  }

  // Data consolidation and reporting
  async getTransactionAndFlowData(startDate, endDate) {
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    const flows = await this.getCashFlowByDateRange(startDate, endDate);
    
    const consolidatedData = [];

    transactions.forEach(txn => {
      const flow = flows.find(f => f.transactionId === txn.id && f.type === 'income');
      if (flow) {
        consolidatedData.push({
          ...flow,
          amount: txn.total,
          description: flow.description
        });
      }
    });

    flows.filter(f => !f.transactionId).forEach(flow => {
      consolidatedData.push(flow);
    });

    return {
      transactions,
      consolidatedFlows: consolidatedData,
      nonTransactionFlows: flows.filter(f => !f.transactionId)
    };
  }

  async getCashFlowSummary(startDate, endDate) {
    const [year, month] = startDate.split('-').map(Number);
    const lastBalance = await this.getLastMonthBalance(year, month);

    const { transactions, consolidatedFlows, nonTransactionFlows } = 
      await this.getTransactionAndFlowData(startDate, endDate);

    const cashTransactions = transactions.filter(t => t.paymentMethod === 'cash');
    const transferTransactions = transactions.filter(t => t.paymentMethod === 'transfer');
    
    const cashFlows = nonTransactionFlows.filter(f => f.paymentMethod === 'cash');
    const transferFlows = nonTransactionFlows.filter(f => f.paymentMethod === 'transfer');

    const calculateTotals = (transactions, nonTxnFlows) => {
      const transactionTotal = transactions.reduce((sum, t) => sum + t.total, 0);
      const nonTxnIncome = nonTxnFlows
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0);
      const nonTxnExpense = nonTxnFlows
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + f.amount, 0);
      
      return {
        totalIncome: transactionTotal + nonTxnIncome,
        totalExpense: nonTxnExpense
      };
    };

    const cashTotals = calculateTotals(cashTransactions, cashFlows);
    const transferTotals = calculateTotals(transferTransactions, transferFlows);

    const processDailyBalances = (transactions, flows, initialBalance) => {
      const [year, month] = startDate.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const result = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const paddedMonth = month.toString().padStart(2, '0');
        const paddedDay = i.toString().padStart(2, '0');
        const date = `${year}-${paddedMonth}-${paddedDay}`;
        
        const dayTransactions = transactions.filter(t => t.date === date);
        const dayFlows = flows.filter(f => f.date === date && !f.transactionId);
    
        const dayIncome = dayFlows
          .filter(f => f.type === 'income')
          .reduce((sum, f) => sum + f.amount, 0) +
          dayTransactions.reduce((sum, t) => sum + t.total, 0);
    
        const dayExpense = dayFlows
          .filter(f => f.type === 'expense')
          .reduce((sum, f) => sum + f.amount, 0);
    
        const dailyBalance = dayIncome - dayExpense;
    
        result.push({
          date,
          income: dayIncome,
          expense: dayExpense,
          dailyBalance,
          runningBalance: dailyBalance
        });
      }
      
      return result;
    };

    return {
      cash: {
        initialBalance: lastBalance.cashBalance,
        income: cashTotals.totalIncome,
        expense: cashTotals.totalExpense,
        balance: lastBalance.cashBalance + cashTotals.totalIncome - cashTotals.totalExpense
      },
      transfer: {
        initialBalance: lastBalance.transferBalance,
        income: transferTotals.totalIncome,
        expense: transferTotals.totalExpense,
        balance: lastBalance.transferBalance + transferTotals.totalIncome - transferTotals.totalExpense
      },
      dailyBalance: {
        cash: processDailyBalances(cashTransactions, cashFlows, lastBalance.cashBalance),
        transfer: processDailyBalances(transferTransactions, transferFlows, lastBalance.transferBalance)
      },
      transactions: consolidatedFlows.sort((a, b) => b.timestamp - a.timestamp)
    };
  }

  // Utility methods
  async updateBalancesForDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
      const startMonth = year === start.getFullYear() ? start.getMonth() + 1 : 1;
      const endMonth = year === end.getFullYear() ? end.getMonth() + 1 : 12;
      
      for (let month = startMonth; month <= endMonth; month++) {
        await this.updateBalanceForMonth(year, month);
      }
    }
  }

  async checkCashAvailability(amount) {
    const currentBalance = await this.getCashBalance();
    return currentBalance >= amount;
  }

  async searchCashFlow(searchTerm, filterType = 'all', paymentMethod = 'all') {
    const startDate = '2020-01-01'; // Or your preferred start date
    const endDate = new Date().toISOString().split('T')[0];
    const { consolidatedFlows } = await this.getTransactionAndFlowData(startDate, endDate);
    
    return consolidatedFlows
        .filter(flow => {
            const matchesSearch = flow.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || flow.type === filterType;
            const matchesPaymentMethod = paymentMethod === 'all' || flow.paymentMethod === paymentMethod;
            
            return matchesSearch && matchesType && matchesPaymentMethod;
        })
        .sort((a, b) => b.timestamp - a.timestamp);
}

// Method to edit existing cash flow
async editCashFlow(id, updatedData) {
    const existingFlow = await dbService.get('cashFlow', id);
    if (!existingFlow) {
        throw new Error('Cash flow not found');
    }

    const updatedFlow = {
        ...existingFlow,
        ...updatedData,
        timestamp: new Date().getTime()
    };

    await dbService.put('cashFlow', updatedFlow);
    await this.updateMonthlyBalance(updatedFlow.date);

    // If the date was changed, we need to update the old month's balance too
    if (existingFlow.date !== updatedFlow.date) {
        await this.updateMonthlyBalance(existingFlow.date);
    }

    return updatedFlow;
}

// Method to delete cash flow
async deleteCashFlow(id) {
    const flow = await dbService.get('cashFlow', id);
    if (!flow) {
        throw new Error('Cash flow not found');
    }

    await dbService.delete('cashFlow', id);
    await this.updateMonthlyBalance(flow.date);
    return true;
}

// Method to get monthly summary statistics
async getMonthlyStatistics(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const summary = await this.getCashFlowSummary(startDate, endDate);

    const statistics = {
        cash: {
            totalIncome: summary.cash.income,
            totalExpense: summary.cash.expense,
            netFlow: summary.cash.income - summary.cash.expense,
            initialBalance: summary.cash.initialBalance,
            finalBalance: summary.cash.balance
        },
        transfer: {
            totalIncome: summary.transfer.income,
            totalExpense: summary.transfer.expense,
            netFlow: summary.transfer.income - summary.transfer.expense,
            initialBalance: summary.transfer.initialBalance,
            finalBalance: summary.transfer.balance
        },
        combined: {
            totalIncome: summary.cash.income + summary.transfer.income,
            totalExpense: summary.cash.expense + summary.transfer.expense,
            netFlow: (summary.cash.income + summary.transfer.income) - 
                    (summary.cash.expense + summary.transfer.expense),
            initialBalance: summary.cash.initialBalance + summary.transfer.initialBalance,
            finalBalance: summary.cash.balance + summary.transfer.balance
        }
    };

    return statistics;
}

// Method to get comparison with previous period
async getComparison(year, month) {
    const currentStats = await this.getMonthlyStatistics(year, month);
    
    // Calculate previous month
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousStats = await this.getMonthlyStatistics(previousYear, previousMonth);

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return current === 0 ? 0 : 100;
        return ((current - previous) / Math.abs(previous)) * 100;
    };

    return {
        cash: {
            incomeChange: calculatePercentageChange(
                currentStats.cash.totalIncome,
                previousStats.cash.totalIncome
            ),
            expenseChange: calculatePercentageChange(
                currentStats.cash.totalExpense,
                previousStats.cash.totalExpense
            ),
            balanceChange: calculatePercentageChange(
                currentStats.cash.finalBalance,
                previousStats.cash.finalBalance
            )
        },
        transfer: {
            incomeChange: calculatePercentageChange(
                currentStats.transfer.totalIncome,
                previousStats.transfer.totalIncome
            ),
            expenseChange: calculatePercentageChange(
                currentStats.transfer.totalExpense,
                previousStats.transfer.totalExpense
            ),
            balanceChange: calculatePercentageChange(
                currentStats.transfer.finalBalance,
                previousStats.transfer.finalBalance
            )
        },
        combined: {
            incomeChange: calculatePercentageChange(
                currentStats.combined.totalIncome,
                previousStats.combined.totalIncome
            ),
            expenseChange: calculatePercentageChange(
                currentStats.combined.totalExpense,
                previousStats.combined.totalExpense
            ),
            balanceChange: calculatePercentageChange(
                currentStats.combined.finalBalance,
                previousStats.combined.finalBalance
            )
        }
    };
}

// Method to validate cash flow data
validateCashFlowData(data) {
    const errors = [];

    if (!data.type || !['income', 'expense'].includes(data.type)) {
        errors.push('Invalid transaction type');
    }

    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        errors.push('Invalid amount');
    }

    if (!data.description || data.description.trim() === '') {
        errors.push('Description is required');
    }

    if (!data.date || isNaN(new Date(data.date).getTime())) {
        errors.push('Invalid date');
    }

    if (!data.paymentMethod || !['cash', 'transfer'].includes(data.paymentMethod)) {
        errors.push('Invalid payment method');
    }

    return errors;
}
}

export const cashFlowService = new CashFlowService();