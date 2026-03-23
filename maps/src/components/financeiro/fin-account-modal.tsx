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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { FinAccount, AccountType, AccountNature } from "./fin-accounts-tree";

const TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "asset",     label: "Ativo" },
  { value: "liability", label: "Passivo" },
  { value: "revenue",   label: "Receita" },
  { value: "expense",   label: "Despesa" },
  { value: "cost",      label: "Custo" },
];

interface FinAccountModalProps {
  open: boolean;
  account: FinAccount | null;
  parentAccount: FinAccount | null; // pre-filled parent when creating sub-account
  onClose: () => void;
  onSaved: (account: FinAccount) => void;
}

export function FinAccountModal({
  open,
  account,
  parentAccount,
  onClose,
  onSaved,
}: FinAccountModalProps) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [type,        setType]        = useState<AccountType>("expense");
  const [nature,      setNature]      = useState<AccountNature>("analytic");
  const [active,      setActive]      = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? "");
    setDescription(account?.description ?? "");
    setType(account?.type ?? parentAccount?.type ?? "expense");
    setNature(account?.nature ?? "analytic");
    setActive(account?.active ?? true);
    setErrors({});
  }, [open, account, parentAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        description: description.trim() || null,
        type,
        nature,
        active,
      };

      if (!account) {
        // creating: attach parent_id if provided
        payload.parent_id = parentAccount?.id ?? null;
      }

      let res;
      if (account) {
        res = await api.put<FinAccount>(`/fin-accounts/${account.id}`, payload);
      } else {
        res = await api.post<FinAccount>("/fin-accounts", payload);
      }
      // API returns flat account (no children); add children: [] for tree compat
      onSaved({ ...res.data, children: account?.children ?? [] });
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

  const isEditing = !!account;
  const title = isEditing
    ? "Editar Conta"
    : parentAccount
    ? `Sub-conta de: ${parentAccount.name}`
    : "Nova Conta";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="fa-name">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="fa-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Receitas Operacionais"
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label htmlFor="fa-description">Descrição</Label>
              <Textarea
                id="fa-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva brevemente o uso desta conta..."
                rows={2}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label htmlFor="fa-type">Tipo <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger id="fa-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>

            {/* Natureza */}
            <div className="space-y-1.5">
              <Label htmlFor="fa-nature">Natureza <span className="text-destructive">*</span></Label>
              <Select value={nature} onValueChange={(v) => setNature(v as AccountNature)}>
                <SelectTrigger id="fa-nature">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytic">Analítica</SelectItem>
                  <SelectItem value="synthetic">Sintética</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <Label htmlFor="fa-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="fa-active" checked={active} onCheckedChange={setActive} />
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
