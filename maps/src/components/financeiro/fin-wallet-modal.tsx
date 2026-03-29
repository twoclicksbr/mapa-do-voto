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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BirthDatePicker } from "@/components/people/birth-date-picker";
import { PlusCircle } from "lucide-react";
import api from "@/lib/api";

interface Person      { id: number; name: string }
interface RefBank     { id: number; name: string }
interface ApiAccount  { id: number; name: string; type: string; nature: string; children: ApiAccount[] }
interface RefAccount  { id: number; label: string; type: string; nature: string }
interface RefPaymentMethod { id: number; name: string; fin_bank_id: number | null }

function flattenAccounts(accounts: ApiAccount[], depth = 0): RefAccount[] {
  return accounts.flatMap((a) => [
    { id: a.id, label: "\u2014 ".repeat(depth) + a.name, type: a.type, nature: a.nature },
    ...flattenAccounts(a.children ?? [], depth + 1),
  ]);
}

function parseCurrency(masked: string): number {
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

function makeCalcKeyDown(
  valueProp: string,
  setValue: (v: string) => void,
  decMode: boolean,
  setDecMode: (v: boolean) => void
) {
  return (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key     = e.key;
    const isDigit = key >= "0" && key <= "9";
    const isComma = key === "," || key === ".";
    const isBack  = key === "Backspace";
    const isDel   = key === "Delete";
    if (!isDigit && !isComma && !isBack && !isDel) return;
    e.preventDefault();

    const value     = valueProp;
    const commaIdx  = value.lastIndexOf(",");
    const intDigits = (commaIdx >= 0 ? value.slice(0, commaIdx) : value).replace(/\D/g, "");
    const decStr    = (commaIdx >= 0 ? value.slice(commaIdx + 1) : "00").replace(/\D/g, "").padEnd(2, "0").slice(0, 2);
    const intVal    = intDigits ? parseInt(intDigits, 10) : 0;
    const rebuild   = (iv: number, ds: string) => (iv > 0 ? iv.toLocaleString("pt-BR") : "0") + "," + ds;

    let newVal = value;

    if (isDel) {
      newVal = ""; setDecMode(false);
    } else if (isComma) {
      if (!decMode) setDecMode(true);
      return;
    } else if (isBack) {
      if (decMode) {
        const newDec = decStr[1] !== "0" ? decStr[0] + "0" : "00";
        if (newDec === "00") setDecMode(false);
        newVal = intVal === 0 && newDec === "00" ? "" : rebuild(intVal, newDec);
      } else {
        const newIntStr = String(intVal).slice(0, -1);
        if (!newIntStr) { setValue(""); return; }
        newVal = parseInt(newIntStr, 10).toLocaleString("pt-BR") + ",00";
      }
    } else if (isDigit) {
      if (decMode) {
        newVal = rebuild(intVal, decStr[0] === "0" ? key + "0" : decStr[0] + key);
      } else {
        const newIntStr = String(intVal === 0 ? "" : intVal) + key;
        newVal = parseInt(newIntStr, 10).toLocaleString("pt-BR") + ",00";
      }
    }

    setValue(newVal);
  };
}

function fmtBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface FinWalletModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function FinWalletModal({ open, onClose, onSaved }: FinWalletModalProps) {
  const [type,            setType]            = useState<"in" | "out">("in");
  const [date,            setDate]            = useState("");
  const [amount,          setAmount]          = useState("");
  const [amountDecMode,   setAmountDecMode]   = useState(false);
  const [description,     setDescription]     = useState("");
  const [banks,           setBanks]           = useState<RefBank[]>([]);
  const [accounts,        setAccounts]        = useState<RefAccount[]>([]);
  const [paymentMethods,  setPaymentMethods]  = useState<RefPaymentMethod[]>([]);
  const [people,          setPeople]          = useState<Person[]>([]);
  const [bankId,          setBankId]          = useState<string>("none");
  const [accountId,       setAccountId]       = useState<string>("none");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("none");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [walletBalance,   setWalletBalance]   = useState<number | null>(null);

  const [peopleId,       setPeopleId]       = useState<number | undefined>();
  const [peopleQuery,    setPeopleQuery]    = useState("");
  const [showDrop,       setShowDrop]       = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(peopleQuery.toLowerCase())
  );

  const handleBankChange = (v: string) => { setBankId(v); setPaymentMethodId("none"); };

  useEffect(() => {
    if (!open) return;
    setType("in");
    setDate("");
    setAmount("");
    setAmountDecMode(false);
    setDescription("");
    setBankId("none");
    setAccountId("none");
    setPaymentMethodId("none");
    setError(null);
    setPeopleId(undefined);
    setPeopleQuery("");
    setWalletBalance(null);

    api.get<Person[]>("/people").then((r) => setPeople(r.data)).catch(() => {});
    api.get<RefBank[]>("/fin-banks").then((r) => setBanks(r.data)).catch(() => {});
    api.get<ApiAccount[]>("/fin-accounts").then((r) => setAccounts(flattenAccounts(r.data))).catch(() => {});
    api.get<RefPaymentMethod[]>("/fin-payment-methods").then((r) => setPaymentMethods(r.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (type === "out" && peopleId) {
      api.get<{ people_id: number; balance: number }>(`/fin-wallets/balance/${peopleId}`)
        .then((r) => setWalletBalance(r.data.balance))
        .catch(() => setWalletBalance(null));
    } else {
      setWalletBalance(null);
    }
  }, [type, peopleId]);

  const handleSave = async () => {
    setError(null);
    if (!peopleId)                { setError("Selecione uma pessoa."); return; }
    if (!date)                    { setError("Informe a data."); return; }
    if (bankId === "none")        { setError("Selecione o banco."); return; }
    if (accountId === "none")     { setError("Selecione a conta financeira."); return; }
    if (paymentMethodId === "none") { setError("Selecione a modalidade."); return; }
    const amountVal = parseCurrency(amount);
    if (!amountVal)               { setError("Informe o valor."); return; }
    if (type === "out" && walletBalance !== null && amountVal > walletBalance) {
      setError(`Saldo insuficiente na carteira. Disponível: ${fmtBRL(walletBalance)}`);
      return;
    }

    setSaving(true);
    try {
      await api.post("/fin-wallets", {
        people_id:          peopleId,
        type,
        date,
        amount:             amountVal,
        description:        description.trim() || null,
        bank_id:            bankId !== "none" ? Number(bankId) : null,
        account_id:         accountId !== "none" ? Number(accountId) : null,
        payment_method_id:  paymentMethodId !== "none" ? Number(paymentMethodId) : null,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const errors = axiosErr?.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(" | "));
      } else {
        setError(axiosErr?.response?.data?.message ?? "Erro ao salvar. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            Novo Lançamento na Carteira
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Linha 1: Tipo + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo <span className="text-destructive">*</span></Label>
              <Select value={type} onValueChange={(v) => { setType(v as "in" | "out"); setAccountId("none"); setWalletBalance(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data <span className="text-destructive">*</span></Label>
              <BirthDatePicker value={date} onChange={setDate} minYear={2020} maxYear={2035} />
            </div>
          </div>

          {/* Linha 2: Pessoa (full) */}
          <div className="space-y-1.5">
            <Label>Pessoa <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                value={peopleQuery}
                onChange={(e) => { setPeopleQuery(e.target.value); setPeopleId(undefined); setShowDrop(true); setHighlightedIdx(-1); }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                onKeyDown={(e) => {
                  if (!showDrop || filteredPeople.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIdx(prev => { const next = Math.min(prev + 1, filteredPeople.length - 1); (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" }); return next; });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIdx(prev => { const next = Math.max(prev - 1, 0); (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" }); return next; });
                  } else if (e.key === "Enter" && highlightedIdx >= 0) {
                    e.preventDefault();
                    const sel = filteredPeople[highlightedIdx];
                    if (sel) { setPeopleId(sel.id); setPeopleQuery(sel.name); setShowDrop(false); setHighlightedIdx(-1); }
                  } else if (e.key === "Escape") {
                    setShowDrop(false); setHighlightedIdx(-1);
                  }
                }}
                placeholder="Digite para buscar..."
                autoComplete="off"
              />
              {showDrop && peopleQuery.length > 0 && (
                <ul ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-48 overflow-y-auto">
                  {filteredPeople.map((p, idx) => (
                    <li key={p.id}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      onMouseDown={() => { setPeopleId(p.id); setPeopleQuery(p.name); setShowDrop(false); setHighlightedIdx(-1); }}
                      className={`cursor-pointer px-3 py-2 text-sm ${idx === highlightedIdx ? "bg-accent" : "hover:bg-accent"}`}>
                      {p.name}
                    </li>
                  ))}
                  {filteredPeople.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado</li>}
                </ul>
              )}
            </div>
            {type === "out" && walletBalance !== null && (
              <p className="text-xs text-muted-foreground">
                Saldo disponível: <span className={`font-semibold ${walletBalance > 0 ? "text-green-600" : "text-destructive"}`}>{fmtBRL(walletBalance)}</span>
              </p>
            )}
          </div>

          {/* Linha 3: Banco + Conta Financeira */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Banco <span className="text-destructive">*</span></Label>
              <Select value={bankId} onValueChange={handleBankChange}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhum —</SelectItem>
                  {banks.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta Financeira <span className="text-destructive">*</span></Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="max-h-52">
                  <SelectItem value="none">— Nenhuma —</SelectItem>
                  {accounts.filter((a) => a.type === (type === "in" ? "revenue" : "expense")).map((a) => (
                    <SelectItem key={a.id} value={String(a.id)} disabled={a.nature === "synthetic"}
                      className={a.nature === "synthetic" ? "text-muted-foreground font-semibold cursor-default" : undefined}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 4: Modalidade + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Modalidade <span className="text-destructive">*</span></Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nenhuma —</SelectItem>
                  {paymentMethods
                    .filter((m) => bankId === "none" || m.fin_bank_id === Number(bankId))
                    .map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor R$ <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={() => {}}
                  onKeyDown={makeCalcKeyDown(amount, setAmount, amountDecMode, setAmountDecMode)}
                  onFocus={() => setAmountDecMode(false)}
                  placeholder="0,00"
                  className="pl-9 text-right font-bold caret-transparent"
                />
              </div>
            </div>
          </div>

          {/* Linha 5: Descrição (full) */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
