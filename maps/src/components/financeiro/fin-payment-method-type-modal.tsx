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
import { FinPaymentMethodType } from "./fin-payment-method-types-data-grid";

interface FinPaymentMethodTypeModalProps {
  open: boolean;
  type: FinPaymentMethodType | null;
  onClose: () => void;
  onSaved: (type: FinPaymentMethodType) => void;
}

export function FinPaymentMethodTypeModal({ open, type, onClose, onSaved }: FinPaymentMethodTypeModalProps) {
  const [name, setName]       = useState("");
  const [active, setActive]   = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(type?.name ?? "");
    setActive(type?.active ?? true);
    setErrors({});
  }, [open, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      let res;
      if (type) {
        res = await api.put<FinPaymentMethodType>(`/fin-payment-method-types/${type.id}`, { name, active });
      } else {
        res = await api.post<FinPaymentMethodType>("/fin-payment-method-types", { name, active });
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
          <DialogTitle>{type ? "Editar Tipo de Modalidade" : "Novo Tipo de Modalidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fpmt-name">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="fpmt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Débito, Crédito, PIX..."
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="fpmt-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="fpmt-active" checked={active} onCheckedChange={setActive} />
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
