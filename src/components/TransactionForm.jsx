import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiX, FiSave } = FiIcons;

const TransactionForm = ({ transaction, onClose }) => {
  const { state, dispatch } = useFinance();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: '',
    account: '',
    description: '',
    category: '',
    subcategory: '',
    amount: ''
  });

  const isEditing = Boolean(transaction);

  // Date formatting utilities
  const formatDateForInput = (dateString) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for input field
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString; // Already in correct format
    }
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: formatDateForInput(transaction.date),
        time: transaction.time,
        type: transaction.type,
        account: transaction.account,
        description: transaction.description,
        category: transaction.category || '',
        subcategory: transaction.subcategory || '',
        amount: transaction.amount.toString()
      });
    }
  }, [transaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.type || !formData.account || !formData.amount) return;

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (isEditing) {
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: { ...transactionData, id: transaction.id }
      });
    } else {
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: transactionData
      });
    }

    onClose();
  };

  const selectedCategory = state.categories.find(cat => cat.id === formData.category);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <SafeIcon icon={FiX} className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select type</option>
              {state.transactionTypes.map(type => (
                <option key={type.id} value={type.category}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select account</option>
              {state.accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Transaction description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select category</option>
              {state.categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory (Optional)</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select subcategory</option>
                {selectedCategory.subcategories.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors flex items-center"
            >
              <SafeIcon icon={isEditing ? FiSave : FiPlus} className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TransactionForm;