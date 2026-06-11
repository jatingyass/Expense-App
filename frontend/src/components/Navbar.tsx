import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-bold text-indigo-600">ExpenseApp</Link>
        <Link to="/" className="text-sm text-gray-600 hover:text-indigo-600">Dashboard</Link>
        {user?.isPremium && (
          <Link to="/leaderboard" className="text-sm text-gray-600 hover:text-indigo-600">Leaderboard</Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user?.isPremium ? (
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-full">
            ★ Premium
          </span>
        ) : (
          <Link to="/premium" className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full hover:bg-indigo-100">
            Upgrade
          </Link>
        )}
        <span className="text-sm text-gray-700">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
