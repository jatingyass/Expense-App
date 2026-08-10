import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import { useAuth } from '../stores/auth';

interface Entry {
  id: number;
  name: string;
  totalSpend: string;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isPremium) { navigate('/', { replace: true }); return; }
    api.get('/premium/leaderboard')
      .then(({ data }) => setEntries(data.leaderboard))
      .catch(e => setError(e.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const fmt = (paise: string) =>
    `₹${(Number(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Spending Leaderboard</h1>
        <p className="text-gray-500 text-sm mb-6">Total spend across all time, all categories.</p>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading…</div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left w-12">Rank</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((e, i) => (
                  <tr key={e.id} className={`hover:bg-gray-50 ${e.id === user?.id ? 'bg-indigo-50' : ''}`}>
                    <td className="px-4 py-3 text-center text-lg">{medals[i] || `${i + 1}`}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {e.name} {e.id === user?.id && <span className="text-xs text-indigo-500 ml-1">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">{fmt(e.totalSpend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && (
              <div className="p-8 text-center text-gray-400">No data yet. Add some expenses!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
