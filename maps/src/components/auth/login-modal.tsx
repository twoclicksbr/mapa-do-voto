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

export function LoginModal() {
  const { open, setOpen, setLoggedIn } = useLoginModal();

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-[#E63946]">
            <MapPin className="size-4 text-white" />
          </div>
          <span className="text-2xl text-foreground">
            <span className="font-normal">Click</span><span className="font-bold">Maps</span>
          </span>
        </div>

        <DialogHeader>
          <DialogTitle>Bem-vindo de volta</DialogTitle>
          <DialogDescription>Entre com sua conta para continuar</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" defaultValue="alex@clickmaps.com.br" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" defaultValue="Alex1985@" />
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={() => { setOpen(false); setLoggedIn(true); }}>Entrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
