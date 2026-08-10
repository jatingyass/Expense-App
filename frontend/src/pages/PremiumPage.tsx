import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import { useAuth } from '../stores/auth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

export default function PremiumPage() {
  const { user, setPremium } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.isPremium) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleUpgrade = async () => {
    setError('');
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setError('Failed to load Razorpay. Check your connection.'); return; }

      const { data: order } = await api.post('/payments/order');

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Expense App',
        description: 'Premium Membership',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPremium();
            navigate('/');
          } catch {
            setError('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#4f46e5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setError(`Payment failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Go Premium</h1>
          <p className="text-gray-500 mb-6">Unlock powerful features for just <strong>₹500</strong> (one-time)</p>

          <ul className="text-left space-y-3 mb-8">
            {[
              'Export your expenses as CSV',
              'View the spending leaderboard',
              'Priority support',
              'All future premium features',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-gray-700 text-sm">
                <span className="text-green-500">✓</span> {f}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition text-base"
          >
            {loading ? 'Processing…' : 'Pay ₹500 →'}
          </button>
          <p className="text-xs text-gray-400 mt-3">Secured by Razorpay · One-time payment</p>
        </div>
      </div>
    </div>
  );
}
