import React, { createContext, useContext, useReducer, useEffect } from 'react';

const FinanceContext = createContext();

const initialState = {
  accounts: [
    { id: '1', name: 'Checking Account', type: 'checking', balance: 2500.00 },
    { id: '2', name: 'Savings Account', type: 'savings', balance: 15000.00 },
    { id: '3', name: 'Credit Card', type: 'credit', balance: -850.00 },
  ],
  transactionTypes: [
    { id: '1', name: 'Income', category: 'income' },
    { id: '2', name: 'Expense', category: 'expense' },
    { id: '3', name: 'Transfer In', category: 'transfer' },
    { id: '4', name: 'Transfer Out', category: 'transfer' },
  ],
  categories: [
    { id: '1', name: 'Food & Dining', subcategories: ['Restaurants', 'Groceries', 'Coffee'] },
    { id: '2', name: 'Transportation', subcategories: ['Gas', 'Public Transit', 'Parking'] },
    { id: '3', name: 'Entertainment', subcategories: ['Movies', 'Games', 'Subscriptions'] },
    { id: '4', name: 'Income', subcategories: ['Salary', 'Freelance', 'Investment'] },
  ],
  transactions: [
    {
      id: '1',
      date: '2024-01-15',
      time: '14:30',
      type: 'expense',
      account: '1',
      description: 'Grocery shopping',
      category: '1',
      subcategory: 'Groceries',
      amount: 125.50
    },
    {
      id: '2',
      date: '2024-01-14',
      time: '09:00',
      type: 'income',
      account: '1',
      description: 'Salary deposit',
      category: '4',
      subcategory: 'Salary',
      amount: 5000.00
    }
  ]
};

function financeReducer(state, action) {
  switch (action.type) {
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, { ...action.payload, id: Date.now().toString() }]
      };

    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(account =>
          account.id === action.payload.id ? action.payload : account
        )
      };

    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter(account => account.id !== action.payload)
      };

    case 'ADD_TRANSACTION_TYPE':
      return {
        ...state,
        transactionTypes: [...state.transactionTypes, { ...action.payload, id: Date.now().toString() }]
      };

    case 'DELETE_TRANSACTION_TYPE':
      return {
        ...state,
        transactionTypes: state.transactionTypes.filter(type => type.id !== action.payload)
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, { ...action.payload, id: Date.now().toString() }]
      };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      };

    case 'ADD_TRANSACTION':
      const newTransaction = { ...action.payload, id: Date.now().toString() };
      
      // Update account balance
      const updatedAccountsAdd = state.accounts.map(account => {
        if (account.id === newTransaction.account) {
          const amount = action.payload.type === 'income' ? newTransaction.amount : -newTransaction.amount;
          return { ...account, balance: account.balance + amount };
        }
        return account;
      });

      return {
        ...state,
        transactions: [...state.transactions, newTransaction],
        accounts: updatedAccountsAdd
      };

    case 'UPDATE_TRANSACTION':
      const oldTransaction = state.transactions.find(t => t.id === action.payload.id);
      const updatedTransaction = action.payload;

      if (!oldTransaction) {
        console.error('Transaction not found for update:', action.payload.id);
        return state;
      }

      // Revert old transaction's effect on account balance
      let accountsAfterRevert = state.accounts.map(account => {
        if (account.id === oldTransaction.account) {
          const revertAmount = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
          return { ...account, balance: account.balance + revertAmount };
        }
        return account;
      });

      // Apply new transaction's effect on account balance
      const accountsAfterUpdate = accountsAfterRevert.map(account => {
        if (account.id === updatedTransaction.account) {
          const amount = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
          return { ...account, balance: account.balance + amount };
        }
        return account;
      });

      return {
        ...state,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.payload.id ? updatedTransaction : transaction
        ),
        accounts: accountsAfterUpdate
      };

    case 'DELETE_TRANSACTION':
      const transactionToDelete = state.transactions.find(t => t.id === action.payload);
      
      if (!transactionToDelete) {
        console.error('Transaction not found for deletion:', action.payload);
        return state;
      }

      // Revert transaction's effect on account balance
      const accountsAfterDelete = state.accounts.map(account => {
        if (account.id === transactionToDelete.account) {
          const amount = transactionToDelete.type === 'income' ? -transactionToDelete.amount : transactionToDelete.amount;
          return { ...account, balance: account.balance + amount };
        }
        return account;
      });

      return {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.payload),
        accounts: accountsAfterDelete
      };

    case 'IMPORT_DATA':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('financeData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'IMPORT_DATA', payload: parsedData });
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('financeData', JSON.stringify(state));
  }, [state]);

  return (
    <FinanceContext.Provider value={{ state, dispatch }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}