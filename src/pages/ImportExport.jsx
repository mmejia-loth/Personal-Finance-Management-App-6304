import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDownload, FiUpload, FiFile, FiFileText, FiDatabase, FiCheck, FiAlertCircle } = FiIcons;

const ImportExport = () => {
  const { state, dispatch } = useFinance();
  const [importStatus, setImportStatus] = useState(null);
  const [exportFormat, setExportFormat] = useState('xlsx');

  // Date formatting utilities
  const formatDateForDisplay = (dateString) => {
    // Convert YYYY-MM-DD to DD/MM/YYYY for display
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const formatDateForStorage = (dateString) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for storage
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Handle DD/MM/YYYY format
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Handle other formats or return current date as fallback
    return new Date().toISOString().split('T')[0];
  };

  const exportData = (format) => {
    const data = state.transactions.map(transaction => ({
      Date: formatDateForDisplay(transaction.date),
      Time: transaction.time,
      Type: transaction.type,
      Account: state.accounts.find(acc => acc.id === transaction.account)?.name || 'Unknown',
      Description: transaction.description,
      Category: state.categories.find(cat => cat.id === transaction.category)?.name || '',
      Subcategory: transaction.subcategory || '',
      Amount: transaction.amount
    }));

    switch (format) {
      case 'xlsx':
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'transactions.xlsx');
        break;
      case 'csv':
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, 'transactions.csv');
        break;
      case 'json':
        const jsonData = {
          accounts: state.accounts,
          categories: state.categories,
          transactionTypes: state.transactionTypes,
          transactions: state.transactions,
          exportDate: new Date().toISOString()
        };
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        saveAs(jsonBlob, 'finance_data.json');
        break;
    }
  };

  const findOrCreateAccount = (accountName) => {
    if (!accountName || accountName.trim() === '') return state.accounts[0]?.id || '';
    
    const trimmedName = accountName.trim();
    const existingAccount = state.accounts.find(acc => 
      acc.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingAccount) {
      return existingAccount.id;
    }
    
    // Create new account only if it doesn't exist
    const newAccountId = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAccount = {
      id: newAccountId,
      name: trimmedName,
      type: 'checking',
      balance: 0
    };
    
    dispatch({ type: 'ADD_ACCOUNT', payload: newAccount });
    return newAccountId;
  };

  const findOrCreateCategory = (categoryName) => {
    if (!categoryName || categoryName.trim() === '') return '';
    
    const trimmedName = categoryName.trim();
    const existingCategory = state.categories.find(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingCategory) {
      return existingCategory.id;
    }
    
    // Create new category only if it doesn't exist
    const newCategoryId = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCategory = {
      id: newCategoryId,
      name: trimmedName,
      subcategories: []
    };
    
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    return newCategoryId;
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(e.target.result);
          // Validate JSON structure
          if (jsonData.accounts && jsonData.transactions) {
            dispatch({ type: 'IMPORT_DATA', payload: jsonData });
            setImportStatus({
              type: 'success',
              message: 'Data imported successfully!'
            });
          } else {
            setImportStatus({
              type: 'error',
              message: 'Invalid JSON format'
            });
          }
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);

          if (data.length === 0) {
            setImportStatus({
              type: 'error',
              message: 'No data found in the file'
            });
            return;
          }

          // Track unique accounts to avoid duplicates
          const accountsToCreate = new Map();
          const categoriesToCreate = new Map();
          
          // First pass: identify unique accounts and categories
          data.forEach(row => {
            if (row.Account && row.Account.trim() !== '') {
              const accountName = row.Account.trim();
              const existingAccount = state.accounts.find(acc => 
                acc.name.toLowerCase() === accountName.toLowerCase()
              );
              
              if (!existingAccount && !accountsToCreate.has(accountName.toLowerCase())) {
                accountsToCreate.set(accountName.toLowerCase(), {
                  id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: accountName,
                  type: 'checking',
                  balance: 0
                });
              }
            }
            
            if (row.Category && row.Category.trim() !== '') {
              const categoryName = row.Category.trim();
              const existingCategory = state.categories.find(cat => 
                cat.name.toLowerCase() === categoryName.toLowerCase()
              );
              
              if (!existingCategory && !categoriesToCreate.has(categoryName.toLowerCase())) {
                categoriesToCreate.set(categoryName.toLowerCase(), {
                  id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: categoryName,
                  subcategories: []
                });
              }
            }
          });

          // Create new accounts first
          accountsToCreate.forEach(account => {
            dispatch({ type: 'ADD_ACCOUNT', payload: account });
          });

          // Create new categories
          categoriesToCreate.forEach(category => {
            dispatch({ type: 'ADD_CATEGORY', payload: category });
          });

          // Second pass: create transactions
          let successfulImports = 0;
          let errors = [];

          data.forEach((row, index) => {
            try {
              // Find account ID
              let accountId = '';
              if (row.Account && row.Account.trim() !== '') {
                const accountName = row.Account.trim();
                const existingAccount = state.accounts.find(acc => 
                  acc.name.toLowerCase() === accountName.toLowerCase()
                );
                
                if (existingAccount) {
                  accountId = existingAccount.id;
                } else {
                  const newAccount = accountsToCreate.get(accountName.toLowerCase());
                  if (newAccount) {
                    accountId = newAccount.id;
                  }
                }
              }

              // Find category ID
              let categoryId = '';
              if (row.Category && row.Category.trim() !== '') {
                const categoryName = row.Category.trim();
                const existingCategory = state.categories.find(cat => 
                  cat.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                if (existingCategory) {
                  categoryId = existingCategory.id;
                } else {
                  const newCategory = categoriesToCreate.get(categoryName.toLowerCase());
                  if (newCategory) {
                    categoryId = newCategory.id;
                  }
                }
              }

              const transaction = {
                id: `imported_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                date: formatDateForStorage(row.Date),
                time: row.Time || '12:00',
                type: (row.Type || 'expense').toLowerCase(),
                account: accountId || state.accounts[0]?.id || '',
                description: row.Description || '',
                category: categoryId,
                subcategory: row.Subcategory || '',
                amount: parseFloat(row.Amount) || 0
              };

              // Validate required fields
              if (!transaction.account || transaction.amount === 0) {
                errors.push(`Row ${index + 1}: Missing account or invalid amount`);
                return;
              }

              dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
              successfulImports++;
              
            } catch (error) {
              errors.push(`Row ${index + 1}: ${error.message}`);
            }
          });

          if (errors.length > 0 && successfulImports === 0) {
            setImportStatus({
              type: 'error',
              message: `Import failed. Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
            });
          } else if (errors.length > 0) {
            setImportStatus({
              type: 'success',
              message: `Imported ${successfulImports} transactions successfully. ${errors.length} errors occurred.`
            });
          } else {
            setImportStatus({
              type: 'success',
              message: `Imported ${successfulImports} transactions successfully!`
            });
          }
        }
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Error importing file: ' + error.message
        });
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }

    // Clear the input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import/Export</h1>
        <p className="text-gray-600">Backup and restore your financial data</p>
      </div>

      {/* Import Status */}
      {importStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center ${
            importStatus.type === 'success'
              ? 'bg-success-50 text-success-700 border border-success-200'
              : 'bg-danger-50 text-danger-700 border border-danger-200'
          }`}
        >
          <SafeIcon
            icon={importStatus.type === 'success' ? FiCheck : FiAlertCircle}
            className="h-5 w-5 mr-2"
          />
          {importStatus.message}
          <button
            onClick={() => setImportStatus(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiDownload} className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Export your financial data in various formats for backup or analysis.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => exportData('xlsx')}
                className="flex items-center justify-center px-4 py-3 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
              >
                <SafeIcon icon={FiFile} className="h-5 w-5 mr-2" />
                Export as Excel
              </button>
              <button
                onClick={() => exportData('csv')}
                className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <SafeIcon icon={FiFileText} className="h-5 w-5 mr-2" />
                Export as CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <SafeIcon icon={FiDatabase} className="h-5 w-5 mr-2" />
                Export as JSON
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Export Information</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Transactions: {state.transactions.length}</li>
              <li>• Accounts: {state.accounts.length}</li>
              <li>• Categories: {state.categories.length}</li>
              <li>• Transaction Types: {state.transactionTypes.length}</li>
              <li>• Date format: DD/MM/YYYY</li>
            </ul>
          </div>
        </motion.div>

        {/* Import Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiUpload} className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Import Data</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Import financial data from Excel, CSV, or JSON files.
          </p>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <SafeIcon icon={FiUpload} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-gray-600">Drag and drop your file here, or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".xlsx,.csv,.json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <span className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                    Choose File
                  </span>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: Excel (.xlsx), CSV (.csv), JSON (.json)
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2">Import Guidelines</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Excel/CSV files should have columns: Date, Time, Type, Account, Description, Category, Subcategory, Amount</li>
              <li>• Date format should be DD/MM/YYYY</li>
              <li>• Accounts with the same name will be merged (not duplicated)</li>
              <li>• Account balances will be updated automatically</li>
              <li>• New accounts and categories will be created if they don't exist</li>
              <li>• JSON files should contain complete finance data structure</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Data Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Data Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{state.transactions.length}</div>
            <div className="text-sm text-gray-600">Transactions</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{state.accounts.length}</div>
            <div className="text-sm text-gray-600">Accounts</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{state.categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{state.transactionTypes.length}</div>
            <div className="text-sm text-gray-600">Transaction Types</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImportExport;