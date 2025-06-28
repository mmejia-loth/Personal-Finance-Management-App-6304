import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiSave, FiX } = FiIcons;

const Accounts = () => {
  const { state, dispatch } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: ''
  });

  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'loan', label: 'Loan Account' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.balance) return;

    const accountData = {
      ...formData,
      balance: parseFloat(formData.balance)
    };

    if (editingAccount) {
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: { ...accountData, id: editingAccount.id }
      });
    } else {
      dispatch({
        type: 'ADD_ACCOUNT',
        payload: accountData
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'checking', balance: '' });
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString()
    });
    setShowForm(true);
  };

  const handleDelete = (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      dispatch({ type: 'DELETE_ACCOUNT', payload: accountId });
    }
  };

  const getAccountTypeLabel = (type) => {
    const accountType = accountTypes.find(t => t.value === type);
    return accountType ? accountType.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
          Add Account
        </button>
      </div>

      {/* Account Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-500"
            >
              <SafeIcon icon={FiX} className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors flex items-center"
              >
                <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
                {editingAccount ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.accounts.map((account) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-full mr-4">
                  <SafeIcon icon={FiCreditCard} className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-600">{getAccountTypeLabel(account.type)}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <SafeIcon icon={FiEdit2} className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-gray-400 hover:text-danger-600 transition-colors"
                >
                  <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className={`text-2xl font-bold ${
                account.balance >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                ${account.balance.toFixed(2)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {state.accounts.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiCreditCard} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first account</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Account
          </button>
        </div>
      )}
    </div>
  );
};

export default Accounts;