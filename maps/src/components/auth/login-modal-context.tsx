import { createContext, useContext, useState } from 'react';

interface LoginModalContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  loggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <LoginModalContext.Provider value={{ open, setOpen, loggedIn, setLoggedIn }}>
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider');
  return ctx;
}
