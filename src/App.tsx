import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, PieChart, Download, Upload, Plus, Settings, List, BarChart3, Trash2, Edit2, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Entertainment', 'Shopping', 'Other'];
const DEFAULT_PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Digital Wallet'];

interface Transaction {
  id: string;
  date: string;
  name: string;
  price: number;
  currency: string;
  priceInMain: number;
  category: string;
  paymentMethod: string;
  createdAt: string;
}

interface FormData {
  date: string;
  name: string;
  price: string;
  currency: string;
  category: string;
  paymentMethod: string;
}

interface ExchangeRates {
  [key: string]: number;
}

const App = () => {
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [paymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [mainCurrency, setMainCurrency] = useState('EUR');
  const [exchangeRates] = useState<ExchangeRates>({ EUR: 1, USD: 1.1, GBP: 0.86, JPY: 150 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    name: '',
    price: '',
    currency: 'EUR',
    category: '',
    paymentMethod: ''
  });

  useEffect(() => {
    loadData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    saveData();
  }, [transactions]);

  const loadData = () => {
    try {
      const stored = localStorage.getItem('travel-spending-data');
      if (stored) {
        const data = JSON.parse(stored);
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.log('Starting fresh');
    }
  };

  const saveData = () => {
    try {
      const data = { transactions, lastSync: new Date().toISOString() };
      localStorage.setItem('travel-spending-data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const convertToMainCurrency = (amount: number, currency: string): number => {
    const rate = exchangeRates[currency] || 1;
    const mainRate = exchangeRates[mainCurrency] || 1;
    return (amount / rate) * mainRate;
  };

  const handleAddTransaction = () => {
    if (!formData.name || !formData.price) {
      alert('Please fill in name and price');
      return;
    }
    const priceInMain = convertToMainCurrency(parseFloat(formData.price), formData.currency);
    const newTransaction: Transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      date: formData.date,
      name: formData.name,
      price: parseFloat(formData.price),
      currency: formData.currency,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      priceInMain,
      createdAt: editingTransaction?.createdAt || new Date().toISOString()
    };
    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? newTransaction : t));
    } else {
      setTransactions([...transactions, newTransaction]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      price: '',
      currency: mainCurrency,
      category: '',
      paymentMethod: ''
    });
    setShowAddForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      name: transaction.name,
      price: transaction.price.toString(),
      currency: transaction.currency,
      category: transaction.category || '',
      paymentMethod: transaction.paymentMethod || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(transactions.map(t => ({
      Date: t.date,
      Name: t.name,
      Price: t.price,
      Currency: t.currency,
      'Price in Main': t.priceInMain.toFixed(2),
      'Main Currency': mainCurrency,
      Category: t.category,
      'Payment Method': t.paymentMethod
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results: Papa.ParseResult<any>) => {
        const imported: Transaction[] = results.data
          .filter((row: any) => row.Date && row.Name && row.Price)
          .map((row: any) => ({
            id: Date.now().toString() + Math.random(),
            date: row.Date,
            name: row.Name,
            price: parseFloat(row.Price),
            currency: row.Currency || mainCurrency,
            priceInMain: parseFloat(row['Price in Main']) || parseFloat(row.Price),
            category: row.Category || '',
            paymentMethod: row['Payment Method'] || '',
            createdAt: new Date().toISOString()
          }));
        setTransactions([...transactions, ...imported]);
        alert(`Imported ${imported.length} transactions`);
      }
    });
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.priceInMain, 0);
  const avgTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;
  
  const spendingByCategory = categories.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.priceInMain, 0)
  })).filter(c => c.value > 0);

  const spendingByDate = transactions.reduce<Array<{date: string, amount: number}>>((acc, t) => {
    const existing = acc.find(a => a.date === t.date);
    if (existing) {
      existing.amount += t.priceInMain;
    } else {
      acc.push({ date: t.date, amount: t.priceInMain });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const spendingByCurrency = transactions.reduce<Array<{currency: string, amount: number}>>((acc, t) => {
    const existing = acc.find(a => a.currency === t.currency);
    if (existing) {
      existing.amount += t.price;
    } else {
      acc.push({ currency: t.currency, amount: t.price });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <DollarSign size={28} />
            <h1 className="text-xl font-bold">Travel Spending</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex overflow-x-auto">
          <button onClick={() => setView('dashboard')} className={`flex-1 min-w-max px-4 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${view === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>
            <BarChart3 size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          <button onClick={() => setView('transactions')} className={`flex-1 min-w-max px-4 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${view === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>
            <List size={20} />
            <span className="font-medium">Transactions</span>
          </button>
          <button onClick={() => setView('settings')} className={`flex-1 min-w-max px-4 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${view === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}>
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-20">
        {view === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Spent</p>
                    <p className="text-3xl font-bold text-blue-600">{totalSpent.toFixed(2)} {mainCurrency}</p>
                  </div>
                  <DollarSign className="text-blue-600" size={40} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Transactions</p>
                    <p className="text-3xl font-bold text-green-600">{transactions.length}</p>
                  </div>
                  <TrendingUp className="text-green-600" size={40} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Average</p>
                    <p className="text-3xl font-bold text-purple-600">{avgTransaction.toFixed(2)} {mainCurrency}</p>
                  </div>
                  <PieChart className="text-purple-600" size={40} />
                </div>
              </div>
            </div>

            {transactions.length > 0 && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold mb-4">Spending Over Time</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={spendingByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#3b82f6" name={mainCurrency} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">By Category</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie data={spendingByCategory} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                          {spendingByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">By Currency</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={spendingByCurrency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="currency" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {transactions.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <DollarSign size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No transactions yet</h3>
                <p className="text-gray-600 mb-4">Start adding your travel expenses</p>
                <button onClick={() => { setView('transactions'); setShowAddForm(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Add First Transaction
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'transactions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Transactions</h2>
              <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <Plus size={20} />
                Add
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{editingTransaction ? 'Edit' : 'New'} Transaction</h3>
                  <button onClick={resetForm} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name/Description *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Lunch" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price *</label>
                      <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Currency</label>
                      <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                        {Object.keys(exchangeRates).map(curr => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method</label>
                    <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                      <option value="">Select payment method</option>
                      {paymentMethods.map(pm => (
                        <option key={pm} value={pm}>{pm}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleAddTransaction} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                    {editingTransaction ? 'Update' : 'Add'} Transaction
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No transactions yet</div>
              ) : (
                [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(transaction => (
                  <div key={transaction.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{transaction.name}</h3>
                            <p className="text-sm text-gray-600">{transaction.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600">{transaction.price} {transaction.currency}</p>
                            {transaction.currency !== mainCurrency && (
                              <p className="text-sm text-gray-600">≈ {transaction.priceInMain.toFixed(2)} {mainCurrency}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {transaction.category && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{transaction.category}</span>
                          )}
                          {transaction.paymentMethod && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{transaction.paymentMethod}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <button onClick={() => handleEdit(transaction)} className="flex-1 flex items-center justify-center gap-1 text-blue-600 hover:bg-blue-50 py-2 rounded">
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button onClick={() => handleDelete(transaction.id)} className="flex-1 flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 py-2 rounded">
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Data Management</h3>
              <div className="space-y-2">
                <button onClick={exportToCSV} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700">
                  <Download size={20} />
                  Export to CSV
                </button>
                <label className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 cursor-pointer">
                  <Upload size={20} />
                  Import from CSV
                  <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
                </label>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Main Currency</h3>
              <select value={mainCurrency} onChange={(e) => setMainCurrency(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                {Object.keys(exchangeRates).map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;