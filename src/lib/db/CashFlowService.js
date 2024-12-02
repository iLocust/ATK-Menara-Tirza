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

  async getCashFlowByType(type) {
    const cashFlows = await dbService.getAllFromIndex('cashFlow', 'type', type);
    const transferFlows = await dbService.getAllFromIndex('transferFlow', 'type', type);
    return [...cashFlows, ...transferFlows];
  }

  async getCashFlowByDateRange(startDate, endDate) {
    const allCashFlow = await this.getAllCashFlow();
    return allCashFlow.filter(flow => {
      const flowDate = new Date(flow.date);
      flowDate.setHours(0, 0, 0, 0);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return flowDate >= start && flowDate <= end;
    });
  }

  async getCashFlowByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const start = startDate.getFullYear() + '-' + 
                 String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(startDate.getDate()).padStart(2, '0');
                 
    const end = endDate.getFullYear() + '-' + 
               String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
               String(endDate.getDate()).padStart(2, '0');
    
    return this.getCashFlowByDateRange(start, end);
  }

  async addCashFlow(data) {
    const baseData = {
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().getTime()
    };

    if (data.paymentMethod === 'cash') {
      return dbService.add('cashFlow', baseData);
    } else if (data.paymentMethod === 'transfer') {
      return dbService.add('transferFlow', baseData);
    }
  }

  async getCashBalance() {
    const cashFlow = await this.getCashOnlyFlow();
    return cashFlow.reduce((balance, flow) => {
      return balance + (flow.type === 'income' ? flow.amount : -flow.amount);
    }, 0);
  }

  async getTransferBalance() {
    const transferFlow = await this.getTransferOnlyFlow();
    return transferFlow.reduce((balance, flow) => {
      return balance + (flow.type === 'income' ? flow.amount : -flow.amount);
    }, 0);
  }

  async checkCashAvailability(amount) {
    const currentBalance = await this.getCashBalance();
    return currentBalance >= amount;
  }

  async getCashFlowSummary(startDate, endDate) {
    const flows = await this.getCashFlowByDateRange(startDate, endDate);
    const cashFlows = flows.filter(f => f.paymentMethod === 'cash');
    const transferFlows = flows.filter(f => f.paymentMethod === 'transfer');
    
    return {
      cash: {
        income: cashFlows
          .filter(f => f.type === 'income')
          .reduce((sum, f) => sum + f.amount, 0),
        expense: cashFlows
          .filter(f => f.type === 'expense')
          .reduce((sum, f) => sum + f.amount, 0),
        balance: cashFlows.reduce((bal, f) => 
          bal + (f.type === 'income' ? f.amount : -f.amount), 0
        )
      },
      transfer: {
        income: transferFlows
          .filter(f => f.type === 'income')
          .reduce((sum, f) => sum + f.amount, 0),
        expense: transferFlows
          .filter(f => f.type === 'expense')
          .reduce((sum, f) => sum + f.amount, 0),
        balance: transferFlows.reduce((bal, f) => 
          bal + (f.type === 'income' ? f.amount : -f.amount), 0
        )
      },
      transactions: flows.sort((a, b) => b.timestamp - a.timestamp)
    };
  }

  async searchCashFlow(searchTerm, filterType = 'all', paymentMethod = 'all') {
    const flows = await this.getAllCashFlow();
    return flows
      .filter(flow => {
        const matchesSearch = flow.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || flow.type === filterType;
        const matchesPaymentMethod = paymentMethod === 'all' || 
                                   flow.paymentMethod === paymentMethod;
        return matchesSearch && matchesType && matchesPaymentMethod;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

export const cashFlowService = new CashFlowService();