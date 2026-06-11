import { useState, FormEvent } from 'react';
import api from '../lib/api';

const CATEGORIES = ['Food','Travel','Bills','Entertainment','Health','Shopping','Education','Salary','Bonus','Investment','Other'];

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddExpenseModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Food',
    kind: 'expense',
    occurredAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const amountPaise = Math.round(parseFloat(form.amount) * 100);
    if (!amountPaise || amountPaise <= 0) { setError('Enter a valid amount'); return; }
    setLoading(true);
    try {
      await api.post('/expenses', {
        amount: amountPaise,
        description: form.description,
        category: form.category,
        kind: form.kind,
        occurredAt: form.occurredAt,
      });
      onAdded();
      onClose();
    } catch (err: any) {
      const d = err.response?.data;
      if (d?.details) setError(d.details[0]?.message);
      else setError(d?.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Add transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {['expense', 'income'].map(k => (
              <button
                key={k}
                type="button"
                onClick={() => setForm(f => ({ ...f, kind: k }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${form.kind === k
                  ? k === 'expense' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {k === 'expense' ? '− Expense' : '+ Income'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Lunch at office"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.occurredAt}
                onChange={e => setForm(f => ({ ...f, occurredAt: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
