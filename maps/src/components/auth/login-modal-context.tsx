import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface UserData {
  id: number;
  email: string;
  people?: {
    id: number;
    name: string;
    photo_sm: string | null;
    photo_md: string | null;
    photo_original: string | null;
    active: boolean;
  };
}

interface LoginModalContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  loggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  logout: () => Promise<void>;
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoggingOut) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setOpen(true);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setLoggedIn(true);
        setUser(res.data);
        setOpen(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setOpen(true);
      });
  }, [isLoggingOut]);

  useEffect(() => {
    const handle = () => {
      setUser(null);
      setLoggedIn(false);
      setOpen(true);
    };
    window.addEventListener('auth:logout', handle);
    return () => window.removeEventListener('auth:logout', handle);
  }, []);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/auth/logout');
    } catch {
      // ignora erro de rede no logout
    }
    localStorage.removeItem('token');
    setUser(null);
    setLoggedIn(false);
    setOpen(true);
    setIsLoggingOut(false);
  };

  return (
    <LoginModalContext.Provider value={{ open, setOpen, loggedIn, setLoggedIn, user, setUser, logout }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider');
  return ctx;
}
