import { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  isPremium: boolean;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setPremium: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

const getStoredUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = (tok: string, u: User) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(tok);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const setPremium = () => {
    if (!user) return;
    const updated = { ...user, isPremium: true };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setPremium }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
