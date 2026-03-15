import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { useLoginModal } from './login-modal-context';
import api from '@/lib/api';

export function LoginModal() {
  const { open, setOpen, setLoggedIn, setUser } = useLoginModal();
  const [email, setEmail] = useState('alex@mapadovoto.com');
  const [password, setPassword] = useState('Alex1985@');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantValid, setTenantValid] = useState<boolean | null>(null);

  useEffect(() => {
    api.get('/auth/tenant')
      .then(() => setTenantValid(true))
      .catch(() => setTenantValid(false));
  }, []);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setLoggedIn(true);
      setOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erro ao conectar com o servidor.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-[#E63946]">
            <MapPin className="size-4 text-white" />
          </div>
          <span className="text-2xl text-foreground">
            <span className="font-normal">Mapa</span><span className="font-bold">do Voto</span>
          </span>
        </div>

        {tenantValid === null && (
          <p className="text-sm text-center text-gray-400 py-4">Verificando...</p>
        )}

        {tenantValid === false && (
          <>
            <DialogHeader>
              <DialogTitle>Gabinete não encontrado</DialogTitle>
              <DialogDescription>
                O endereço acessado não corresponde a nenhum gabinete cadastrado. Verifique o link e tente novamente.
              </DialogDescription>
            </DialogHeader>
          </>
        )}

        {tenantValid === true && (
          <>
            <DialogHeader>
              <DialogTitle>Bem-vindo de volta</DialogTitle>
              <DialogDescription>Entre com sua conta para continuar</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <DialogFooter>
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </DialogFooter>

            <div className="text-center mt-3">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Crie sua conta!
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
