import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateSelector, formatDateValue, type DateSelectorValue, type DateSelectorI18nConfig } from "@/components/reui/date-selector";
import { Search, ChevronDown, CalendarIcon, X } from "lucide-react";
import api from "@/lib/api";

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

const DATE_FIELD_LABELS: Record<string, string> = {
  created_at: "Criado em",
  updated_at: "Editado em",
};

const STATUS_OPTIONS: { value: string; label: string; variant: "success" | "destructive" }[] = [
  { value: "active",   label: "Ativo",   variant: "success" },
  { value: "inactive", label: "Inativo", variant: "destructive" },
];

export interface FinPaymentMethodsFilters {
  filterId?:   string;
  filterName?: string;
  typeIds?:    number[];
  bankIds?:    number[];
  status?:     string[];
  dateField?:  string;
  dateValue?:  DateSelectorValue;
}

interface RefType { id: number; name: string }
interface RefBank { id: number; name: string }

interface FinPaymentMethodsFilterModalProps {
  open:    boolean;
  filters: FinPaymentMethodsFilters;
  onClose: () => void;
  onApply: (filters: FinPaymentMethodsFilters) => void;
}

export function FinPaymentMethodsFilterModal({
  open, filters, onClose, onApply,
}: FinPaymentMethodsFilterModalProps) {
  const [filterId,      setFilterId]      = useState("");
  const [filterName,    setFilterName]    = useState("");
  const [statuses,      setStatuses]      = useState<string[]>([]);
  const [statusPopover, setStatusPopover] = useState(false);
  const [tempStatuses,  setTempStatuses]  = useState<string[]>([]);
  const [bankIds,       setBankIds]       = useState<number[]>([]);
  const [bankPopover,   setBankPopover]   = useState(false);
  const [tempBankIds,   setTempBankIds]   = useState<number[]>([]);
  const [typeIds,       setTypeIds]       = useState<number[]>([]);
  const [typePopover,   setTypePopover]   = useState(false);
  const [tempTypeIds,   setTempTypeIds]   = useState<number[]>([]);
  const [dateField,     setDateField]     = useState("created_at");
  const [dateValue,     setDateValue]     = useState<DateSelectorValue | undefined>();
  const [dateOpen,      setDateOpen]      = useState(false);
  const [dateInternal,  setDateInternal]  = useState<DateSelectorValue | undefined>();

  const [types, setTypes] = useState<RefType[]>([]);
  const [banks, setBanks] = useState<RefBank[]>([]);

  // Carrega tipos e bancos ao abrir
  useEffect(() => {
    if (!open) return;
    api.get<RefType[]>("/fin-payment-method-types").then(r => setTypes(r.data)).catch(() => {});
    api.get<RefBank[]>("/fin-banks").then(r => setBanks(r.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setFilterId(filters.filterId ?? "");
    setFilterName(filters.filterName ?? "");
    setStatuses(filters.status ?? []);
    setBankIds(filters.bankIds ?? []);
    setTypeIds(filters.typeIds ?? []);
    setDateField(filters.dateField ?? "created_at");
    setDateValue(filters.dateValue);
  }, [open]);

  useEffect(() => {
    if (dateOpen) setDateInternal(dateValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  const hasFilters = !!(filterId || filterName || typeIds.length || bankIds.length || statuses.length || dateValue);

  const handleClear = () => {
    setFilterId("");
    setFilterName("");
    setStatuses([]);
    setBankIds([]);
    setTypeIds([]);
    setDateField("created_at");
    setDateValue(undefined);
  };

  const handleApply = () => {
    onApply({
      filterId:   filterId   || undefined,
      filterName: filterName || undefined,
      typeIds:    typeIds.length  > 0 ? typeIds  : undefined,
      bankIds:    bankIds.length  > 0 ? bankIds  : undefined,
      status:     statuses.length > 0 ? statuses : undefined,
      dateField,
      dateValue,
    });
    onClose();
  };

  const bankLabel = bankIds.length === 0
    ? "Todos"
    : bankIds.length === 1
    ? banks.find((b) => b.id === bankIds[0])?.name ?? "1 selecionado"
    : `${bankIds.length} selecionados`;

  const typeLabel = typeIds.length === 0
    ? "Todos"
    : typeIds.length === 1
    ? types.find((t) => t.id === typeIds[0])?.name ?? "1 selecionado"
    : `${typeIds.length} selecionados`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Pesquisa Avançada — Modalidades de Pagamento
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">

          {/* Linha 1: ID(2) + Nome(7) + Status(3) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>ID</Label>
              <Input
                placeholder="Ex: 1"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
              />
            </div>
            <div className="col-span-7 space-y-1.5">
              <Label>Nome</Label>
              <Input
                placeholder="Digite para buscar..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="col-span-3 space-y-1.5">
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
                <PopoverContent className="w-40 p-2" align="start">
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
                        <Badge variant={s.variant} appearance="light" size="sm">{s.label}</Badge>
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

          {/* Linha 2: Pesquisar por(2) + Período(4) + Banco(3) + Tipo(3) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Pesquisar por</Label>
              <Select value={dateField} onValueChange={(v) => { setDateField(v); setDateValue(undefined); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Criado em</SelectItem>
                  <SelectItem value="updated_at">Editado em</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                      <DialogTitle>{DATE_FIELD_LABELS[dateField] ?? "Período"}</DialogTitle>
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
            <div className="col-span-3 space-y-1.5">
              <Label>Banco</Label>
              <Popover open={bankPopover} onOpenChange={(v) => { if (v) setTempBankIds(bankIds); setBankPopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">{bankLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                    {banks.map((b) => (
                      <label key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox
                          checked={tempBankIds.includes(b.id)}
                          onCheckedChange={(checked) =>
                            setTempBankIds((prev) =>
                              checked ? [...prev, b.id] : prev.filter((id) => id !== b.id)
                            )
                          }
                        />
                        <span className="text-sm">{b.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempBankIds(bankIds); setBankPopover(false); }}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => { setBankIds(tempBankIds); setBankPopover(false); }}>
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Tipo</Label>
              <Popover open={typePopover} onOpenChange={(v) => { if (v) setTempTypeIds(typeIds); setTypePopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">{typeLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                    {types.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox
                          checked={tempTypeIds.includes(t.id)}
                          onCheckedChange={(checked) =>
                            setTempTypeIds((prev) =>
                              checked ? [...prev, t.id] : prev.filter((id) => id !== t.id)
                            )
                          }
                        />
                        <span className="text-sm">{t.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempTypeIds(typeIds); setTypePopover(false); }}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => { setTypeIds(tempTypeIds); setTypePopover(false); }}>
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
