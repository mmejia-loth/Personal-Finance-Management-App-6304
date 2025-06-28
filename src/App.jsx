import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import TransactionTypes from './pages/TransactionTypes';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import ImportExport from './pages/ImportExport';
import './App.css';

function App() {
  return (
    <FinanceProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transaction-types" element={<TransactionTypes />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/import-export" element={<ImportExport />} />
          </Routes>
        </Layout>
      </Router>
    </FinanceProvider>
  );
}

export default App;