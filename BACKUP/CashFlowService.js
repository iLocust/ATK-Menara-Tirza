// CashFlowService.js
import { dbService } from './db-service';

class CashFlowService {
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

  async saveMonthEndBalance(year, month, cashBalance, transferBalance) {
    const lastDay = new Date(year, month, 0);
    const date = lastDay.toLocaleDateString('sv').split('T')[0];

    await dbService.add('monthlyBalance', {
      date,
      cashBalance,
      transferBalance,
      timestamp: new Date().getTime()
    });
  }

async updateMonthlyBalance(date) {
  const transactionDate = new Date(date);
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth() + 1;
  
  const monthStart = new Date(year, month - 1, 1)
    .toISOString().split('T')[0];
    
  const balances = await dbService.getAllFromIndex('monthlyBalance', 'date', monthStart);
  const currentCashBalance = await this.getCashBalance();

    if (balances.length > 0) {
      await dbService.put('monthlyBalance', {
        ...balances[0],
        cashBalance: currentCashBalance,
        timestamp: new Date().getTime()
      });
    } else {
      await dbService.add('monthlyBalance', {
        date: monthStart,
        cashBalance: currentCashBalance,
        transferBalance: 0,
        timestamp: new Date().getTime()
      });
    }
  }

  async getLastMonthBalance(year, month) {
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    const lastMonthEnd = new Date(previousYear, previousMonth, 0)
      .toISOString().split('T')[0];

    const balances = await dbService.getAllFromIndex('monthlyBalance', 'date', lastMonthEnd);
    return balances[0] || { cashBalance: 0, transferBalance: 0 };
  }

  async addCashFlow(data) {
    const baseData = {
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().getTime()
    };
  
    const result = await dbService.add('cashFlow', baseData);
    await this.updateMonthlyBalance(data.date);
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

  async checkCashAvailability(amount) {
    const currentBalance = await this.getCashBalance();
    return currentBalance >= amount;
  }

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
      let runningBalance = initialBalance;
      const daysInMonth = new Date(year, month, 0).getDate();
      
      return Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(year, month - 1, i + 1)
          .toISOString().split('T')[0];
        
        const dayTransactions = transactions.filter(t => t.date === date);
        const dayFlows = flows.filter(f => f.date === date);
        
        const income = dayTransactions.reduce((sum, t) => sum + t.total, 0) +
          dayFlows.filter(f => f.type === 'income')
            .reduce((sum, f) => sum + f.amount, 0);
        
        const expense = dayFlows.filter(f => f.type === 'expense')
          .reduce((sum, f) => sum + f.amount, 0);
        
        runningBalance += income - expense;
        
        return {
          date,
          income,
          expense,
          dailyBalance: income - expense,
          runningBalance
        };
      });
    };

    const isCompleteMonth = new Date(endDate).getDate() === 
      new Date(year, month, 0).getDate();
    
    if (isCompleteMonth) {
      await this.saveMonthEndBalance(
        year,
        month,
        lastBalance.cashBalance + cashTotals.totalIncome - cashTotals.totalExpense,
        lastBalance.transferBalance + transferTotals.totalIncome - transferTotals.totalExpense
      );
    }

    return {
      cash: {
        initialBalance: lastBalance.cashBalance,
        income: cashTotals.totalIncome,
        expense: cashTotals.totalExpense,
        balance: cashTotals.totalIncome - cashTotals.totalExpense
      },
      transfer: {
        initialBalance: lastBalance.transferBalance,
        income: transferTotals.totalIncome,
        expense: transferTotals.totalExpense,
        balance: transferTotals.totalIncome - transferTotals.totalExpense
      },
      dailyBalance: {
        cash: processDailyBalances(cashTransactions, cashFlows, lastBalance.cashBalance),
        transfer: processDailyBalances(transferTransactions, transferFlows, lastBalance.transferBalance)
      },
      transactions: consolidatedFlows.sort((a, b) => b.timestamp - a.timestamp)
    };
  }

  async searchCashFlow(searchTerm, filterType = 'all', paymentMethod = 'all') {
    const { consolidatedFlows } = await this.getTransactionAndFlowData();
    
    return consolidatedFlows
      .filter(flow => {
        const matchesSearch = flow.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || flow.type === filterType;
        const matchesPaymentMethod = paymentMethod === 'all' || flow.paymentMethod === paymentMethod;
        
        return matchesSearch && matchesType && matchesPaymentMethod;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const cashFlowService = new CashFlowService();
