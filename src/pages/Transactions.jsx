import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import TransactionForm from '../components/TransactionForm';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiFilter, FiSearch, FiCalendar, FiDollarSign, FiCheckSquare, FiSquare } = FiIcons;

const Transactions = () => {
  const { state, dispatch } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    search: '',
    account: '',
    category: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Date formatting utilities
  const formatDateForDisplay = useCallback((dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  }, []);

  // Memoized filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = state.transactions.filter(transaction => {
      const matchesSearch = !filters.search || 
        transaction.description.toLowerCase().includes(filters.search.toLowerCase());
      const matchesAccount = !filters.account || transaction.account === filters.account;
      const matchesCategory = !filters.category || transaction.category === filters.category;
      const matchesType = !filters.type || transaction.type === filters.type;
      const matchesDateFrom = !filters.dateFrom || transaction.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || transaction.date <= filters.dateTo;

      return matchesSearch && matchesAccount && matchesCategory && matchesType && 
             matchesDateFrom && matchesDateTo;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date + ' ' + a.time);
          bValue = new Date(b.date + ' ' + b.time);
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description?.toLowerCase() || '';
          bValue = b.description?.toLowerCase() || '';
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [state.transactions, filters, sortBy, sortOrder]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Memoized helper functions
  const getAccountName = useCallback((accountId) => {
    const account = state.accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  }, [state.accounts]);

  const getCategoryName = useCallback((categoryId) => {
    if (!categoryId) return '';
    const category = state.categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }, [state.categories]);

  const getTransactionTypeName = useCallback((type) => {
    const transactionType = state.transactionTypes.find(t => t.category === type);
    return transactionType ? transactionType.name : type;
  }, [state.transactionTypes]);

  // Selection handlers
  const handleSelectTransaction = useCallback((transactionId) => {
    setSelectedTransactions(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(transactionId)) {
        newSelection.delete(transactionId);
      } else {
        newSelection.add(transactionId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedTransactions(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(paginatedTransactions.map(t => t.id));
      setSelectedTransactions(allIds);
      setSelectAll(true);
    }
  }, [selectAll, paginatedTransactions]);

  const handleBulkDelete = useCallback(() => {
    if (selectedTransactions.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTransactions.size} selected transaction(s)?`;
    if (window.confirm(confirmMessage)) {
      // Delete each selected transaction
      selectedTransactions.forEach(transactionId => {
        dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
      });
      
      // Clear selection
      setSelectedTransactions(new Set());
      setSelectAll(false);
    }
  }, [selectedTransactions, dispatch]);

  const handleEdit = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
      
      // Remove from selection if it was selected
      setSelectedTransactions(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(transactionId);
        return newSelection;
      });
    }
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      account: '',
      category: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  }, []);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }, [filteredTransactions]);

  // Pagination handlers
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    setSelectedTransactions(new Set());
    setSelectAll(false);
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectedTransactions(new Set());
    setSelectAll(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">
            Manage all your financial transactions ({filteredTransactions.length} total)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedTransactions.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-danger-600 text-white px-4 py-2 rounded-lg hover:bg-danger-700 transition-colors flex items-center"
            >
              <SafeIcon icon={FiTrash2} className="h-4 w-4 mr-2" />
              Delete Selected ({selectedTransactions.size})
            </button>
          )}
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SafeIcon icon={FiFilter} className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(1);
                }}
                placeholder="Search descriptions..."
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={filters.account}
              onChange={(e) => {
                setFilters({ ...filters, account: e.target.value });
                setCurrentPage(1);
              }}
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
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {state.categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                setFilters({ ...filters, dateFrom: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => {
                setFilters({ ...filters, dateTo: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
              {filteredTransactions.length !== state.transactions.length && 
                ` (filtered from ${state.transactions.length} total)`
              }
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Net Total:</span>
              <span className={`font-semibold ${totalAmount >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {totalAmount >= 0 ? '+' : ''}${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="description">Description</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder.toUpperCase()}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2"
                  >
                    <SafeIcon 
                      icon={selectAll ? FiCheckSquare : FiSquare} 
                      className="h-4 w-4" 
                    />
                    <span>Select</span>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <SafeIcon icon={FiDollarSign} className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No transactions found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedTransactions.has(transaction.id) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectTransaction(transaction.id)}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <SafeIcon 
                          icon={selectedTransactions.has(transaction.id) ? FiCheckSquare : FiSquare} 
                          className="h-4 w-4" 
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{formatDateForDisplay(transaction.date)}</div>
                        <div className="text-gray-500">{transaction.time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description || 'No description'}
                      </div>
                      {transaction.subcategory && (
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.subcategory}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getAccountName(transaction.account)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryName(transaction.category) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-success-100 text-success-800'
                          : transaction.type === 'expense'
                          ? 'bg-danger-100 text-danger-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}>
                        {getTransactionTypeName(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={`${
                        transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-gray-400 hover:text-danger-600 transition-colors"
                        >
                          <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 border rounded-md text-sm transition-colors ${
                      currentPage === pageNum
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm 
          transaction={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }} 
        />
      )}
    </div>
  );
};

export default Transactions;