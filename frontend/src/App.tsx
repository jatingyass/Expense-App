import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PremiumPage from './pages/PremiumPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const Private = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:id" element={<ResetPasswordPage />} />
      <Route path="/" element={<Private><DashboardPage /></Private>} />
      <Route path="/premium" element={<Private><PremiumPage /></Private>} />
      <Route path="/leaderboard" element={<Private><LeaderboardPage /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
