import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTrash2, FiList, FiTrendingUp, FiTrendingDown, FiRefreshCw } = FiIcons;

const TransactionTypes = () => {
  const { state, dispatch } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'expense'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    dispatch({
      type: 'ADD_TRANSACTION_TYPE',
      payload: formData
    });

    setFormData({ name: '', category: 'expense' });
    setShowForm(false);
  };

  const handleDelete = (typeId) => {
    if (window.confirm('Are you sure you want to delete this transaction type?')) {
      dispatch({ type: 'DELETE_TRANSACTION_TYPE', payload: typeId });
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'income':
        return FiTrendingUp;
      case 'expense':
        return FiTrendingDown;
      case 'transfer':
        return FiRefreshCw;
      default:
        return FiList;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'income':
        return 'text-success-600 bg-success-100';
      case 'expense':
        return 'text-danger-600 bg-danger-100';
      case 'transfer':
        return 'text-primary-600 bg-primary-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Types</h1>
          <p className="text-gray-600">Manage your transaction categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
          Add Type
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Transaction Type</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter transaction type name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors"
              >
                Add Type
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Transaction Types List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transaction Types</h2>
        </div>
        <div className="p-6">
          {state.transactionTypes.length === 0 ? (
            <div className="text-center py-8">
              <SafeIcon icon={FiList} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transaction types yet</h3>
              <p className="text-gray-600 mb-4">Add your first transaction type to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Type
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.transactionTypes.map((type) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${getCategoryColor(type.category)}`}>
                      <SafeIcon icon={getCategoryIcon(type.category)} className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{type.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="text-gray-400 hover:text-danger-600 transition-colors"
                  >
                    <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionTypes;