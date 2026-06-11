import { useState, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function ResetPasswordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/auth/reset-password/${id}`)
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { requestId: id, newPassword: password });
      setDone(true);
    } catch (err: any) {
      const d = err.response?.data;
      if (d?.details) setError(d.details[0]?.message || 'Invalid password');
      else setError(d?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Validating link…</div>;
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link invalid or expired</h2>
          <button onClick={() => navigate('/forgot-password')} className="text-indigo-600 hover:underline text-sm">
            Request a new link
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h2>
          <button onClick={() => navigate('/login')} className="mt-3 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h1>
        <p className="text-gray-500 text-sm mb-6">Must be at least 8 characters with uppercase, lowercase and a number.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
