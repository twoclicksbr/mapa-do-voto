import { createContext, useContext, useState } from 'react';
import api from '@/lib/api';

interface UserData {
  id: number;
  email: string;
  people?: {
    id: number;
    name: string;
    avatar_url: string | null;
    active: boolean;
  };
}

interface LoginModalContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  loggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  user: UserData | null;
  logout: () => Promise<void>;
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignora erro de rede no logout
    }
    localStorage.removeItem('token');
    setUser(null);
    setLoggedIn(false);
    setOpen(true);
  };

  return (
    <LoginModalContext.Provider value={{ open, setOpen, loggedIn, setLoggedIn, user, logout }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider');
  return ctx;
}
