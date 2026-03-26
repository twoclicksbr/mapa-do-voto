import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateSelector, formatDateValue, type DateSelectorValue, type DateSelectorI18nConfig } from "@/components/reui/date-selector";
import { Search, ChevronDown, CalendarIcon, X } from "lucide-react";
import api from "@/lib/api";

interface RefPerson { id: number; name: string }
interface RefBank   { id: number; name: string }
interface ApiAccount { id: number; name: string; type: string; nature: string; children: ApiAccount[] }
interface RefAccount { id: number; label: string; type: string; nature: string }
interface RefPaymentMethod { id: number; name: string }

export interface FinTitlesFilters {
  invoiceNumber?: string;
  peopleId?: number;
  peopleName?: string;
  documentNumber?: string;
  status?: string[];
  dateField?: string;
  dateValue?: DateSelectorValue;
  amountField?: string;
  amountValue?: string;
  bankId?: number;
  accountId?: number;
  paymentMethodId?: number;
}

const DATE_FIELD_LABELS: Record<string, string> = {
  created_at:  "Data de Cadastro",
  issue_date:  "Data de Emissão",
  due_date:    "Data de Vencimento",
  paid_at:     "Data de Baixa",
  reversed_at:  "Data de Estorno",
  cancelled_at: "Data de Cancelamento",
};

const DATE_SELECTOR_I18N: DateSelectorI18nConfig = {
  selectDate: "Selecionar data",
  apply: "Aplicar",
  cancel: "Cancelar",
  clear: "Limpar",
  today: "Hoje",
  filterLabel: "Condição",
  filterTypes: { is: "na data", before: "antes de", after: "depois de", between: "entre" },
  periodTypes: { day: "Dia", month: "Mês", quarter: "Trimestre", halfYear: "Semestre", year: "Ano" },
  months: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  monthsShort: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  quarters: ["T1","T2","T3","T4"],
  halfYears: ["S1","S2"],
  weekdays: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  weekdaysShort: ["Do","Se","Te","Qu","Qu","Se","Sá"],
  placeholder: "Selecione uma data...",
  rangePlaceholder: "Selecione um período...",
};

const STATUS_OPTIONS: { value: string; label: string; variant: "primary" | "success" | "warning" | "destructive" | "info" }[] = [
  { value: "pending",   label: "Pendente",     variant: "primary" },
  { value: "paid",      label: "Pago",         variant: "success" },
  { value: "partial",   label: "Pago Parcial", variant: "warning" },
  { value: "cancelled", label: "Cancelado",    variant: "destructive" },
  { value: "reversed",  label: "Estornado",    variant: "info" },
];

const EMPTY_FILTERS: FinTitlesFilters = {};

interface FinTitlesFilterModalProps {
  open: boolean;
  filters: FinTitlesFilters;
  titleType: 'income' | 'expense';
  onClose: () => void;
  onApply: (filters: FinTitlesFilters) => void;
}

function flattenAccounts(accounts: ApiAccount[], depth = 0): RefAccount[] {
  return accounts.flatMap((a) => [
    { id: a.id, label: "\u2014 ".repeat(depth) + a.name, type: a.type, nature: a.nature },
    ...flattenAccounts(a.children ?? [], depth + 1),
  ]);
}

export function FinTitlesFilterModal({
  open,
  filters,
  titleType,
  onClose,
  onApply,
}: FinTitlesFilterModalProps) {
  const [invoiceNumber,  setInvoiceNumber]  = useState("");
  const [peopleId,       setPeopleId]       = useState<number | undefined>();
  const [peopleQuery,    setPeopleQuery]    = useState("");
  const [showPeopleDrop, setShowPeopleDrop] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [people,         setPeople]         = useState<RefPerson[]>([]);
  const [documentNumber, setDocumentNumber] = useState("");
  const [statuses,       setStatuses]       = useState<string[]>([]);
  const [statusPopover,  setStatusPopover]  = useState(false);
  const [tempStatuses,   setTempStatuses]   = useState<string[]>([]);
  const [dateField,      setDateField]      = useState("due_date");
  const [dateValue,      setDateValue]      = useState<DateSelectorValue | undefined>();
  const [dateOpen,       setDateOpen]       = useState(false);
  const [dateInternal,   setDateInternal]   = useState<DateSelectorValue | undefined>();
  const [amountField,    setAmountField]    = useState("amount");
  const [amountValue,    setAmountValue]    = useState("");
  const [amountDecMode,  setAmountDecMode]  = useState(false);
  const [amountDecStr,   setAmountDecStr]   = useState("");
  const [banks,          setBanks]          = useState<RefBank[]>([]);
  const [accounts,       setAccounts]       = useState<RefAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<RefPaymentMethod[]>([]);
  const [bankId,         setBankId]         = useState<string>("all");
  const [accountId,      setAccountId]      = useState<string>("all");
  const [paymentMethodId,setPaymentMethodId]= useState<string>("all");
  const dropdownRef   = useRef<HTMLUListElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Carrega pessoas e inicializa campos ao abrir
  useEffect(() => {
    if (!open) return;
    setInvoiceNumber(filters.invoiceNumber ?? "");
    setPeopleId(filters.peopleId);
    setPeopleQuery(filters.peopleName ?? "");
    setDocumentNumber(filters.documentNumber ?? "");
    setStatuses(filters.status ?? []);
    setDateField(filters.dateField ?? "due_date");
    setDateValue(filters.dateValue);
    setAmountField(filters.amountField ?? "amount");
    setAmountValue(filters.amountValue ?? "");
    setAmountDecMode(false);
    setAmountDecStr("");
    setBankId(filters.bankId ? String(filters.bankId) : "all");
    setAccountId(filters.accountId ? String(filters.accountId) : "all");
    setPaymentMethodId(filters.paymentMethodId ? String(filters.paymentMethodId) : "all");
    api.get<RefPerson[]>("/people").then((r) => setPeople(r.data)).catch(() => {});
    api.get<RefBank[]>("/fin-banks").then((r) => setBanks(r.data)).catch(() => {});
    api.get<ApiAccount[]>("/fin-accounts").then((r) => setAccounts(flattenAccounts(r.data))).catch(() => {});
    api.get<RefPaymentMethod[]>("/fin-payment-methods").then((r) => setPaymentMethods(r.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (dateOpen) setDateInternal(dateValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(peopleQuery.toLowerCase())
  );

  const hasFilters = !!(invoiceNumber || peopleId || documentNumber || statuses.length || dateValue || amountValue || bankId !== "all" || accountId !== "all" || paymentMethodId !== "all");

  const handleClear = () => {
    setInvoiceNumber("");
    setPeopleId(undefined);
    setPeopleQuery("");
    setDocumentNumber("");
    setStatuses([]);
    setDateField("due_date");
    setDateValue(undefined);
    setAmountField("amount");
    setAmountValue("");
    setAmountDecMode(false);
    setAmountDecStr("");
    setBankId("all");
    setAccountId("all");
    setPaymentMethodId("all");
  };

  const handleApply = () => {
    onApply({
      invoiceNumber:  invoiceNumber  || undefined,
      peopleId:       peopleId,
      peopleName:     peopleId ? peopleQuery : undefined,
      documentNumber: documentNumber || undefined,
      status:         statuses.length > 0 ? statuses : undefined,
      dateField:      dateField,
      dateValue:      dateValue,
      amountField:      amountField,
      amountValue:      amountValue || undefined,
      bankId:           bankId !== "all" ? Number(bankId) : undefined,
      accountId:        accountId !== "all" ? Number(accountId) : undefined,
      paymentMethodId:  paymentMethodId !== "all" ? Number(paymentMethodId) : undefined,
    });
    onClose();
  };

  function handleAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key     = e.key;
    const isDigit = key >= "0" && key <= "9";
    const isComma = key === "," || key === ".";
    const isBack  = key === "Backspace";
    const isDel   = key === "Delete";
    if (!isDigit && !isComma && !isBack && !isDel) return;
    e.preventDefault();

    const commaIdx = amountValue.indexOf(",");
    const intPart  = commaIdx >= 0 ? amountValue.slice(0, commaIdx) : amountValue;
    const intVal   = parseInt(intPart.replace(/\D/g, ""), 10) || 0;

    const rebuild = (iv: number, dec: string) =>
      (iv > 0 ? iv.toLocaleString("pt-BR") : "0") + "," + dec.padEnd(2, "0");

    if (isDel) {
      setAmountValue(""); setAmountDecMode(false); setAmountDecStr(""); return;
    }

    if (isComma) {
      if (!amountDecMode) {
        setAmountDecMode(true);
        setAmountDecStr("");
        if (!amountValue.includes(","))
          setAmountValue((intVal > 0 ? intVal.toLocaleString("pt-BR") : "0") + ",00");
      }
      return;
    }

    if (isBack) {
      if (amountDecMode) {
        if (amountDecStr.length > 0) {
          const newDec = amountDecStr.slice(0, -1);
          setAmountDecStr(newDec);
          setAmountValue(rebuild(intVal, newDec));
        } else {
          setAmountDecMode(false);
          setAmountDecStr("");
          setAmountValue(intVal > 0 ? intVal.toLocaleString("pt-BR") + ",00" : "");
        }
      } else {
        const newIntStr = String(intVal).slice(0, -1);
        if (!newIntStr) { setAmountValue(""); return; }
        setAmountValue(parseInt(newIntStr, 10).toLocaleString("pt-BR") + ",00");
      }
      return;
    }

    if (isDigit) {
      if (amountDecMode) {
        if (amountDecStr.length < 2) {
          const newDec = amountDecStr + key;
          setAmountDecStr(newDec);
          setAmountValue(rebuild(intVal, newDec));
        }
      } else {
        const newIntVal = parseInt(String(intVal === 0 ? "" : intVal) + key, 10);
        setAmountValue(newIntVal.toLocaleString("pt-BR") + ",00");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Pesquisa Avançada
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Título */}
            <div className="col-span-2 space-y-1.5">
              <Label>Título</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Nº do título"
              />
            </div>

            {/* Pessoa */}
            <div className="col-span-6 space-y-1.5">
              <Label>Pessoa</Label>
              <div className="relative">
                <Input
                  value={peopleQuery}
                  onChange={(e) => {
                    setPeopleQuery(e.target.value);
                    setPeopleId(undefined);
                    setShowPeopleDrop(true);
                    setHighlightedIdx(-1);
                  }}
                  onFocus={() => setShowPeopleDrop(true)}
                  onBlur={() => setTimeout(() => setShowPeopleDrop(false), 150)}
                  onKeyDown={(e) => {
                    if (!showPeopleDrop || filteredPeople.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedIdx((prev) => {
                        const next = Math.min(prev + 1, filteredPeople.length - 1);
                        const el = dropdownRef.current?.children[next] as HTMLElement;
                        el?.scrollIntoView({ block: "nearest" });
                        return next;
                      });
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedIdx((prev) => {
                        const next = Math.max(prev - 1, 0);
                        const el = dropdownRef.current?.children[next] as HTMLElement;
                        el?.scrollIntoView({ block: "nearest" });
                        return next;
                      });
                    } else if (e.key === "Enter" && highlightedIdx >= 0) {
                      e.preventDefault();
                      const selected = filteredPeople[highlightedIdx];
                      if (selected) {
                        setPeopleId(selected.id);
                        setPeopleQuery(selected.name);
                        setShowPeopleDrop(false);
                        setHighlightedIdx(-1);
                      }
                    } else if (e.key === "Escape") {
                      setShowPeopleDrop(false);
                      setHighlightedIdx(-1);
                    }
                  }}
                  placeholder="Digite para buscar..."
                  autoComplete="off"
                />
                {showPeopleDrop && peopleQuery.length > 0 && (
                  <ul
                    ref={dropdownRef}
                    className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-48 overflow-y-auto"
                  >
                    {filteredPeople.map((p, idx) => (
                      <li
                        key={p.id}
                        onMouseEnter={() => setHighlightedIdx(idx)}
                        onMouseDown={() => {
                          setPeopleId(p.id);
                          setPeopleQuery(p.name);
                          setShowPeopleDrop(false);
                          setHighlightedIdx(-1);
                        }}
                        className={`cursor-pointer px-3 py-2 text-sm ${idx === highlightedIdx ? "bg-accent" : "hover:bg-accent"}`}
                      >
                        {p.name}
                      </li>
                    ))}
                    {filteredPeople.length === 0 && (
                      <li className="px-3 py-2 text-sm text-muted-foreground">
                        Nenhum resultado
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Documento */}
            <div className="col-span-2 space-y-1.5">
              <Label>Documento</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Nº do documento"
              />
            </div>

            {/* Status */}
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Popover open={statusPopover} onOpenChange={(v) => { if (v) setTempStatuses(statuses); setStatusPopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">
                      {statuses.length === 0
                        ? "Todos"
                        : statuses.length === 1
                        ? STATUS_OPTIONS.find((s) => s.value === statuses[0])?.label
                        : `${statuses.length} selecionados`}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {STATUS_OPTIONS.map((s) => (
                      <label key={s.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox
                          checked={tempStatuses.includes(s.value)}
                          onCheckedChange={(checked) =>
                            setTempStatuses((prev) =>
                              checked ? [...prev, s.value] : prev.filter((v) => v !== s.value)
                            )
                          }
                        />
                        <Badge variant={s.variant} appearance="light" size="sm">
                          {s.label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempStatuses(statuses); setStatusPopover(false); }}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => { setStatuses(tempStatuses); setStatusPopover(false); }}>
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {/* Linha 2 */}
          <div className="grid grid-cols-12 gap-4 items-end">
            {/* Pesquisar por */}
            <div className="col-span-3 space-y-1.5">
              <Label>Pesquisar por</Label>
              <Select value={dateField} onValueChange={(v) => { setDateField(v); setDateValue(undefined); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de Cadastro</SelectItem>
                  <SelectItem value="issue_date">Data de Emissão</SelectItem>
                  <SelectItem value="due_date">Data de Vencimento</SelectItem>
                  <SelectItem value="paid_at">Data de Baixa</SelectItem>
                  <SelectItem value="reversed_at">Data de Estorno</SelectItem>
                  <SelectItem value="cancelled_at">Data de Cancelamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date picker */}
            <div className="col-span-4 space-y-1.5">
              <Label>Período</Label>
              <div className="relative">
                <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                  <button
                    type="button"
                    onClick={() => setDateOpen(true)}
                    className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors"
                  >
                    <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate pr-5">
                      {dateValue ? formatDateValue(dateValue, DATE_SELECTOR_I18N, "dd/MM/yyyy") : "Selecionar período"}
                    </span>
                  </button>
                  <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>
                        {DATE_FIELD_LABELS[dateField] ?? "Período"}
                      </DialogTitle>
                    </DialogHeader>
                    <DateSelector
                      value={dateInternal}
                      onChange={setDateInternal}
                      showInput={true}
                      i18n={DATE_SELECTOR_I18N}
                      dayDateFormat="dd/MM/yyyy"
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button variant="primary" onClick={() => { setDateValue(dateInternal); setDateOpen(false); }}>
                        Aplicar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {dateValue && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDateValue(undefined); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Pesquisar por valor */}
            <div className="col-span-3 space-y-1.5">
              <Label>Pesquisar por valor</Label>
              <Select value={amountField} onValueChange={(v) => { setAmountField(v); setAmountValue(""); setAmountDecMode(false); setAmountDecStr(""); setTimeout(() => amountInputRef.current?.focus(), 150); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Valor R$</SelectItem>
                  <SelectItem value="interest_pct">Juros %</SelectItem>
                  <SelectItem value="interest">Juros R$</SelectItem>
                  <SelectItem value="penalty_pct">Multa %</SelectItem>
                  <SelectItem value="penalty">Multa R$</SelectItem>
                  <SelectItem value="discount_pct">Desconto %</SelectItem>
                  <SelectItem value="discount">Desconto R$</SelectItem>
                  <SelectItem value="amount_paid">Baixa R$</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="col-span-2 space-y-1.5">
              <Label>Valor</Label>
              {amountField.endsWith("_pct") ? (
                <div className="relative">
                  <Input
                    ref={amountInputRef}
                    type="text"
                    inputMode="decimal"
                    value={amountValue}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, "");
                      if (!/^\d*(,\d*)?$/.test(raw)) return;
                      const [intPart, decPart] = raw.split(",");
                      const formatted = parseInt(intPart || "0", 10).toLocaleString("pt-BR") + (raw.includes(",") ? "," + (decPart ?? "") : "");
                      setAmountValue(intPart === "" ? "" : formatted);
                    }}
                    placeholder="0"
                    className="pr-8 text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                  <Input
                    ref={amountInputRef}
                    type="text"
                    inputMode="numeric"
                    value={amountValue}
                    onChange={() => {}}
                    onKeyDown={handleAmountKeyDown}
                    placeholder="0,00"
                    className="pl-9 text-right font-bold caret-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Linha 3 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Banco */}
            <div className="space-y-1.5">
              <Label>Banco</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conta Financeira */}
            <div className="space-y-1.5">
              <Label>Conta Financeira</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {accounts
                    .filter((a) => a.type === (titleType === 'income' ? 'revenue' : 'expense'))
                    .map((a) => (
                      <SelectItem
                        key={a.id}
                        value={String(a.id)}
                        disabled={a.nature === "synthetic"}
                        className={a.nature === "synthetic" ? "text-muted-foreground font-semibold cursor-default" : undefined}
                      >
                        {a.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modalidade */}
            <div className="space-y-1.5">
              <Label>Modalidade</Label>
              <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={hasFilters ? handleClear : onClose}>
            {hasFilters ? "Limpar filtros" : "Fechar"}
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
