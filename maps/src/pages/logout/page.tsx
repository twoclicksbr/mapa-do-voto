import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLoginModal } from '@/components/auth/login-modal-context';

export function LogoutPage() {
  const { logout } = useLoginModal();
  const navigate = useNavigate();

  useEffect(() => {
    logout().then(() => navigate('/', { replace: true }));
  }, []);

  return null;
}
