import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import TransactionForm from '../components/TransactionForm';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTrendingUp, FiTrendingDown, FiDollarSign, FiCreditCard, FiTrash2 } = FiIcons;

const Dashboard = () => {
  const { state, dispatch } = useFinance();
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const totalBalance = state.accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
    .slice(0, 5);

  const handleDeleteTransaction = (transactionId) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
  };

  const getAccountName = (accountId) => {
    const account = state.accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getCategoryName = (categoryId) => {
    const category = state.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your financial status</p>
        </div>
        <button
          onClick={() => setShowTransactionForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ${totalBalance.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <SafeIcon icon={FiDollarSign} className="h-6 w-6 text-primary-600" />
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
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-danger-600">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-danger-100 rounded-full">
              <SafeIcon icon={FiTrendingDown} className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{state.accounts.length}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <SafeIcon icon={FiCreditCard} className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet. Add your first transaction!</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-semibold ${
                          transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-gray-400 hover:text-danger-600 transition-colors"
                        >
                          <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {getAccountName(transaction.account)} • {transaction.date} at {transaction.time}
                      {transaction.category && ` • ${getCategoryName(transaction.category)}`}
                      {transaction.subcategory && ` > ${transaction.subcategory}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm onClose={() => setShowTransactionForm(false)} />
      )}
    </div>
  );
};

export default Dashboard;