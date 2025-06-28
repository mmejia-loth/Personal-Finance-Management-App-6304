import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import ReactECharts from 'echarts-for-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBarChart3, FiPieChart, FiTrendingUp, FiCalendar, FiFilter } = FiIcons;

const Reports = () => {
  const { state } = useFinance();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      const dateMatch = isWithinInterval(transactionDate, { start: startDate, end: endDate });
      const accountMatch = !selectedAccount || transaction.account === selectedAccount;
      const categoryMatch = !selectedCategory || transaction.category === selectedCategory;
      
      return dateMatch && accountMatch && categoryMatch;
    });
  }, [state.transactions, dateRange, selectedAccount, selectedCategory]);

  const incomeVsExpenseData = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      option: {
        title: {
          text: 'Income vs Expenses',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: ${c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'Amount',
            type: 'pie',
            radius: '50%',
            data: [
              { value: income, name: 'Income', itemStyle: { color: '#22c55e' } },
              { value: expenses, name: 'Expenses', itemStyle: { color: '#ef4444' } }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    };
  }, [filteredTransactions]);

  const categoryBreakdown = useMemo(() => {
    const categoryTotals = {};
    
    filteredTransactions.forEach(transaction => {
      if (transaction.category) {
        const category = state.categories.find(cat => cat.id === transaction.category);
        const categoryName = category ? category.name : 'Unknown';
        
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += transaction.amount;
      }
    });

    const data = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

    return {
      option: {
        title: {
          text: 'Spending by Category',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: ${c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'Amount',
            type: 'pie',
            radius: ['40%', '70%'],
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    };
  }, [filteredTransactions, state.categories]);

  const monthlyTrend = useMemo(() => {
    const monthlyData = {};
    
    filteredTransactions.forEach(transaction => {
      const month = format(new Date(transaction.date), 'yyyy-MM');
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[month].expenses += transaction.amount;
      }
    });

    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expenses);

    return {
      option: {
        title: {
          text: 'Monthly Trend',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Income', 'Expenses']
        },
        xAxis: {
          type: 'category',
          data: months.map(month => format(new Date(month + '-01'), 'MMM yyyy'))
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '${value}'
          }
        },
        series: [
          {
            name: 'Income',
            type: 'line',
            data: incomeData,
            itemStyle: { color: '#22c55e' }
          },
          {
            name: 'Expenses',
            type: 'line',
            data: expenseData,
            itemStyle: { color: '#ef4444' }
          }
        ]
      }
    };
  }, [filteredTransactions]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Analyze your financial data</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <SafeIcon icon={FiFilter} className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Accounts</option>
              {state.accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {state.categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-success-600">${totalIncome.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <SafeIcon icon={FiTrendingUp} className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-danger-600">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-danger-100 rounded-full">
              <SafeIcon icon={FiTrendingUp} className="h-6 w-6 text-danger-600 transform rotate-180" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ${netIncome.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${netIncome >= 0 ? 'bg-success-100' : 'bg-danger-100'}`}>
              <SafeIcon 
                icon={FiTrendingUp} 
                className={`h-6 w-6 ${netIncome >= 0 ? 'text-success-600' : 'text-danger-600 transform rotate-180'}`} 
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <ReactECharts option={incomeVsExpenseData.option} style={{ height: '400px' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <ReactECharts option={categoryBreakdown.option} style={{ height: '400px' }} />
        </motion.div>
      </div>

      {/* Monthly Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <ReactECharts option={monthlyTrend.option} style={{ height: '400px' }} />
      </motion.div>
    </div>
  );
};

export default Reports;