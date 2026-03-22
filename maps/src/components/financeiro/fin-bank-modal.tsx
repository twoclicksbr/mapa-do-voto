import { useState, useEffect, useRef } from "react";
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
import { FinBank } from "./fin-banks-data-grid";

const BR_BANKS: { code: string; name: string }[] = [
  // Tradicionais
  { code: "001", name: "Banco do Brasil" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "208", name: "BTG Pactual" },
  { code: "422", name: "Safra" },
  { code: "756", name: "Sicoob" },
  { code: "748", name: "Sicredi" },
  { code: "041", name: "Banrisul" },
  { code: "070", name: "BRB" },
  { code: "037", name: "Banpará" },
  { code: "004", name: "Banco do Nordeste" },
  { code: "003", name: "Banco da Amazônia" },
  { code: "655", name: "Votorantim" },
  { code: "246", name: "ABC Brasil" },
  { code: "707", name: "Daycoval" },
  { code: "389", name: "Mercantil do Brasil" },
  { code: "021", name: "Banestes" },
  { code: "745", name: "Citibank" },
  { code: "399", name: "HSBC" },
  // Digitais
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "336", name: "C6 Bank" },
  { code: "237", name: "Next" },
  { code: "536", name: "Neon" },
  { code: "380", name: "PicPay" },
  { code: "323", name: "Mercado Pago" },
  { code: "290", name: "PagBank" },
  { code: "403", name: "Cora" },
  { code: "461", name: "Asaas" },
  { code: "348", name: "XP Investimentos" },
  { code: "212", name: "Banco Original" },
  { code: "301", name: "BPP" },
  { code: "318", name: "BMG" },
  { code: "313", name: "Hapi Bank" },
  { code: "654", name: "Banco Digimais" },
  { code: "197", name: "Stone" },
  { code: "332", name: "Acesso Soluções" },
  { code: "364", name: "Gerencianet" },
];

interface FinBankModalProps {
  open: boolean;
  bank: FinBank | null;
  onClose: () => void;
  onSaved: (bank: FinBank) => void;
}

export function FinBankModal({ open, bank, onClose, onSaved }: FinBankModalProps) {
  const [name, setName]         = useState("");
  const [bankName, setBankName] = useState("");
  const [agency, setAgency]     = useState("");
  const [account, setAccount]   = useState("");
  const [main, setMain]         = useState(false);
  const [active, setActive]     = useState(true);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const [bankQuery, setBankQuery]       = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const bankInputRef = useRef<HTMLInputElement>(null);

  const suggestions = bankQuery.trim().length > 0
    ? BR_BANKS.filter((b) =>
        b.name.toLowerCase().includes(bankQuery.toLowerCase()) ||
        b.code.includes(bankQuery)
      )
    : [];

  useEffect(() => {
    if (!open) return;
    setName(bank?.name ?? "");
    setBankName(bank?.bank ?? "");
    setBankQuery(bank?.bank ?? "");
    setAgency(bank?.agency ?? "");
    setAccount(bank?.account ?? "");
    setMain(bank?.main ?? false);
    setActive(bank?.active ?? true);
    setErrors({});
    setShowSuggestions(false);
  }, [open, bank]);

  const handleBankSelect = (bank: { code: string; name: string }) => {
    const value = `${bank.code} - ${bank.name}`;
    setBankName(value);
    setBankQuery(value);
    setShowSuggestions(false);
  };

  const handleBankInput = (value: string) => {
    setBankQuery(value);
    setBankName(value);
    setShowSuggestions(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        name,
        bank: bankName || null,
        agency: agency || null,
        account: account || null,
        main,
        active,
      };
      let res;
      if (bank) {
        res = await api.put<FinBank>(`/fin-banks/${bank.id}`, payload);
      } else {
        res = await api.post<FinBank>("/fin-banks", payload);
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
          <DialogTitle>{bank ? "Editar Banco" : "Novo Banco"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fb-name">Nome da conta <span className="text-destructive">*</span></Label>
              <Input
                id="fb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Conta Corrente Principal"
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-bank">Banco</Label>
              <div className="relative">
                <Input
                  id="fb-bank"
                  ref={bankInputRef}
                  value={bankQuery}
                  onChange={(e) => handleBankInput(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Ex: Bradesco, Itaú, Nubank..."
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((b) => (
                      <li key={`${b.code}-${b.name}`}>
                        <button
                          type="button"
                          onMouseDown={() => handleBankSelect(b)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-primary transition-colors flex items-center gap-2"
                        >
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{b.code}</span>
                          {b.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {errors.bank && <p className="text-xs text-destructive">{errors.bank}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fb-agency">Agência</Label>
                <Input
                  id="fb-agency"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="0000"
                />
                {errors.agency && <p className="text-xs text-destructive">{errors.agency}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fb-account">Conta</Label>
                <Input
                  id="fb-account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="00000-0"
                />
                {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="fb-main">Conta principal</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{main ? "Sim" : "Não"}</span>
                <Switch id="fb-main" checked={main} onCheckedChange={setMain} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="fb-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="fb-active" checked={active} onCheckedChange={setActive} />
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
