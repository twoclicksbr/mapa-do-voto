import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";
import { TypeContact } from "./type-contacts-data-grid";

interface TypeContactsModalProps {
  open: boolean;
  typeContact: TypeContact | null;
  onClose: () => void;
  onSaved: (tc: TypeContact) => void;
}

export function TypeContactsModal({ open, typeContact, onClose, onSaved }: TypeContactsModalProps) {
  const [name, setName] = useState("");
  const [mask, setMask] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(typeContact?.name ?? "");
    setMask(typeContact?.mask ?? "");
    setActive(typeContact?.active ?? true);
    setErrors({});
  }, [open, typeContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      let res;
      if (typeContact) {
        res = await api.put<TypeContact>(`/type-contacts/${typeContact.id}`, { name, mask: mask || null, active });
      } else {
        res = await api.post<TypeContact>("/type-contacts", { name, mask: mask || null, active });
      }
      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const apiErrors = axiosErr?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(apiErrors)) {
          flat[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(flat);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{typeContact ? "Editar Tipo de Contato" : "Novo Tipo de Contato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tc-name">Nome</Label>
              <Input
                id="tc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Celular, E-mail, WhatsApp..."
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-mask">Máscara</Label>
              <Input
                id="tc-mask"
                value={mask}
                onChange={(e) => setMask(e.target.value)}
                placeholder="Ex: (99) 99999-9999"
              />
              {errors.mask && <p className="text-xs text-destructive">{errors.mask}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tc-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="tc-active" checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
