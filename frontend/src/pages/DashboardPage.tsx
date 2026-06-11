import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AddExpenseModal from '../components/AddExpenseModal';
import api from '../lib/api';
import { useAuth } from '../stores/auth';

interface Expense {
  id: number;
  kind: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  occurredAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORIES = ['all','Food','Travel','Bills','Entertainment','Health','Shopping','Education','Salary','Bonus','Investment','Other'];
const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [filters, setFilters] = useState({ kind: 'all', category: 'all', page: 1 });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(filters.page),
        limit: '10',
        kind: filters.kind,
        category: filters.category,
      });
      const { data } = await api.get(`/expenses?${params}`);
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const totalIncome = expenses.filter(e => e.kind === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses.filter(e => e.kind === 'expense').reduce((s, e) => s + e.amount, 0);

  const handleDownload = async () => {
    setReportLoading(true);
    try {
      const { data } = await api.get('/premium/report');
      window.open(data.fileUrl, '_blank');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Download failed');
    } finally {
      setReportLoading(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Income (this page)</p>
            <p className="text-xl font-bold text-green-600">{fmt(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Expenses (this page)</p>
            <p className="text-xl font-bold text-red-500">{fmt(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Net (this page)</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
              {fmt(totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={filters.kind}
            onChange={e => setFilters(f => ({ ...f, kind: e.target.value, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <select
            value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>

          <div className="ml-auto flex gap-2">
            {user?.isPremium && (
              <button
                onClick={handleDownload}
                disabled={reportLoading}
                className="px-3 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 disabled:opacity-60"
              >
                {reportLoading ? 'Exporting…' : '↓ Export CSV'}
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Expense list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No transactions yet. Add one!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{e.occurredAt?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-gray-900">{e.description}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{e.category}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${e.kind === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {e.kind === 'income' ? '+' : '−'}{fmt(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteExpense(e.id)} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500">
              {filters.page} / {pagination.totalPages}
            </span>
            <button
              disabled={filters.page === pagination.totalPages}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {!user?.isPremium && (
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-indigo-900">Unlock Premium</p>
              <p className="text-indigo-700 text-sm">Export CSV reports, view leaderboard & more.</p>
            </div>
            <Link to="/premium" className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">
              Upgrade ₹500
            </Link>
          </div>
        )}
      </div>

      {showModal && <AddExpenseModal onClose={() => setShowModal(false)} onAdded={fetchExpenses} />}
    </div>
  );
}
