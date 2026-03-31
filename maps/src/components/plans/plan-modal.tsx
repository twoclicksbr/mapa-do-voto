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
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { Plan } from "./plans-data-grid";

interface PlanModalProps {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSaved: (plan: Plan) => void;
}

const parseCurrency = (v: string) => parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0;

const maskCurrencyNatural = (value: string): string => {
  const clean = value.replace(/[^\d,]/g, "");
  const parts = clean.split(",");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (parts.length === 1) return intPart;
  return intPart + "," + parts[1].slice(0, 2);
};

const maskCurrencyNaturalBlur = (value: string): string => {
  const num = parseCurrency(value);
  if (isNaN(num)) return "0,00";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function PlanModal({ open, plan, onClose, onSaved }: PlanModalProps) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [priceMonth,  setPriceMonth]  = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [priceSetup,  setPriceSetup]  = useState("");
  const [maxUsers,    setMaxUsers]    = useState<string>("");
  const [hasSchema,     setHasSchema]     = useState(false);
  const [recommended,   setRecommended]   = useState(false);
  const [active,      setActive]      = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(plan?.name ?? "");
    setDescription(plan?.description ?? "");
    const fmtLoad = (v: number) => parseFloat(String(v)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setPriceMonth(plan ? fmtLoad(plan.price_month) : "");
    setPriceYearly(plan ? fmtLoad(plan.price_yearly) : "");
    setPriceSetup(plan ? fmtLoad(plan.price_setup) : "");
    setMaxUsers(plan?.max_users != null ? String(plan.max_users) : "");
    setHasSchema(plan?.has_schema ?? false);
    setRecommended(plan?.recommended ?? false);
    setActive(plan?.active ?? true);
    setErrors({});
  }, [open, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        name,
        description: description || null,
        price_month:  parseCurrency(priceMonth),
        price_yearly: parseCurrency(priceYearly),
        price_setup:  priceSetup ? parseCurrency(priceSetup) : null,
        max_users:    maxUsers ? parseInt(maxUsers, 10) : null,
        has_schema: hasSchema,
        recommended,
        active,
      };
      let res;
      if (plan) {
        res = await api.put<Plan>(`/plans/${plan.id}`, payload);
      } else {
        res = await api.post<Plan>("/plans", payload);
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Básico, Profissional, Enterprise..."
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-desc">Descrição</Label>
              <Textarea
                id="plan-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que está incluído neste plano..."
                rows={3}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-maxusers">Usuários</Label>
                <Input
                  id="plan-maxusers"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value.replace(/\D/g, ""))}
                  onFocus={(e) => e.target.select()}
                  placeholder="Ilimitado"
                />
                {errors.max_users && <p className="text-xs text-destructive">{errors.max_users}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-setup">Taxa de Setup</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="plan-setup"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={priceSetup}
                    onChange={(e) => setPriceSetup(maskCurrencyNatural(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => setPriceSetup(e.target.value ? maskCurrencyNaturalBlur(e.target.value) : "")}
                    placeholder="0,00"
                    className="pl-9 text-right font-bold"
                  />
                </div>
                {errors.price_setup && <p className="text-xs text-destructive">{errors.price_setup}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-month">Preço Mensal <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="plan-month"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={priceMonth}
                    onChange={(e) => setPriceMonth(maskCurrencyNatural(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => setPriceMonth(maskCurrencyNaturalBlur(e.target.value))}
                    placeholder="0,00"
                    className="pl-9 text-right font-bold"
                  />
                </div>
                {errors.price_month && <p className="text-xs text-destructive">{errors.price_month}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-yearly">Preço Anual <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="plan-yearly"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={priceYearly}
                    onChange={(e) => setPriceYearly(maskCurrencyNatural(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => setPriceYearly(maskCurrencyNaturalBlur(e.target.value))}
                    placeholder="0,00"
                    className="pl-9 text-right font-bold"
                  />
                </div>
                {errors.price_yearly && <p className="text-xs text-destructive">{errors.price_yearly}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="plan-recommended">Recomendado</Label>
                <p className="text-xs text-muted-foreground">Destaca este plano como o mais indicado</p>
              </div>
              <Switch id="plan-recommended" checked={recommended} onCheckedChange={setRecommended} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="plan-schema">Inclui CRM</Label>
                <p className="text-xs text-muted-foreground">Cria schema de gestão de gabinete</p>
              </div>
              <Switch id="plan-schema" checked={hasSchema} onCheckedChange={setHasSchema} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="plan-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="plan-active" checked={active} onCheckedChange={setActive} />
              </div>
            </div>

          </DialogBody>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !name.trim() || !priceMonth || !priceYearly}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
