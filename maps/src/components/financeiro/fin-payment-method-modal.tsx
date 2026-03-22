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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { FinPaymentMethod } from "./fin-payment-methods-data-grid";

interface FinBank {
  id: number;
  name: string;
  bank: string | null;
}

interface FinPaymentMethodType {
  id: number;
  name: string;
}

interface FinPaymentMethodModalProps {
  open: boolean;
  method: FinPaymentMethod | null;
  onClose: () => void;
  onSaved: (method: FinPaymentMethod) => void;
}

export function FinPaymentMethodModal({ open, method, onClose, onSaved }: FinPaymentMethodModalProps) {
  const [name, setName]     = useState("");
  const [bankId, setBankId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [banks, setBanks]     = useState<FinBank[]>([]);
  const [types, setTypes]     = useState<FinPaymentMethodType[]>([]);

  useEffect(() => {
    if (!open) return;
    api.get<FinBank[]>("/fin-banks").then((res) => setBanks(res.data)).catch(() => setBanks([]));
    api.get<FinPaymentMethodType[]>("/fin-payment-method-types").then((res) => setTypes(res.data)).catch(() => setTypes([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setName(method?.name ?? "");
    setBankId(method?.fin_bank_id ? String(method.fin_bank_id) : "");
    setTypeId(method?.fin_payment_method_type_id ? String(method.fin_payment_method_type_id) : "");
    setActive(method?.active ?? true);
    setErrors({});
  }, [open, method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        name,
        fin_bank_id: bankId ? Number(bankId) : null,
        fin_payment_method_type_id: typeId ? Number(typeId) : null,
        active,
      };
      let res;
      if (method) {
        res = await api.put<FinPaymentMethod>(`/fin-payment-methods/${method.id}`, payload);
      } else {
        res = await api.post<FinPaymentMethod>("/fin-payment-methods", payload);
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
          <DialogTitle>{method ? "Editar Modalidade" : "Nova Modalidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fpm-name">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="fpm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: PIX, Cartão de Crédito..."
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fpm-bank">Banco</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger id="fpm-bank">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.bank ? `${b.bank} - ${b.name}` : b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fpm-type">Tipo</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger id="fpm-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fin_payment_method_type_id && (
                <p className="text-xs text-destructive">{errors.fin_payment_method_type_id}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="fpm-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="fpm-active" checked={active} onCheckedChange={setActive} />
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
