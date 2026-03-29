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

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "asset",     label: "Ativo" },
  { value: "liability", label: "Passivo" },
  { value: "revenue",   label: "Receita" },
  { value: "expense",   label: "Despesa" },
  { value: "cost",      label: "Custo" },
];

const NATURE_OPTIONS: { value: string; label: string }[] = [
  { value: "analytic",  label: "Analítica" },
  { value: "synthetic", label: "Sintética" },
];

export interface FinAccountsFilters {
  filterName?: string;
  types?:      string[];
  natures?:    string[];
  status?:     string[];
  dateField?:  string;
  dateValue?:  DateSelectorValue;
}

interface FinAccountsFilterModalProps {
  open:    boolean;
  filters: FinAccountsFilters;
  onClose: () => void;
  onApply: (filters: FinAccountsFilters) => void;
}

export function FinAccountsFilterModal({
  open, filters, onClose, onApply,
}: FinAccountsFilterModalProps) {
  const [filterName,    setFilterName]    = useState("");
  const [statuses,      setStatuses]      = useState<string[]>([]);
  const [statusPopover, setStatusPopover] = useState(false);
  const [tempStatuses,  setTempStatuses]  = useState<string[]>([]);
  const [types,         setTypes]         = useState<string[]>([]);
  const [typePopover,   setTypePopover]   = useState(false);
  const [tempTypes,     setTempTypes]     = useState<string[]>([]);
  const [natures,       setNatures]       = useState<string[]>([]);
  const [naturePopover, setNaturePopover] = useState(false);
  const [tempNatures,   setTempNatures]   = useState<string[]>([]);
  const [dateField,     setDateField]     = useState("created_at");
  const [dateValue,     setDateValue]     = useState<DateSelectorValue | undefined>();
  const [dateOpen,      setDateOpen]      = useState(false);
  const [dateInternal,  setDateInternal]  = useState<DateSelectorValue | undefined>();

  useEffect(() => {
    if (!open) return;
    setFilterName(filters.filterName ?? "");
    setStatuses(filters.status  ?? []);
    setTypes(filters.types      ?? []);
    setNatures(filters.natures  ?? []);
    setDateField(filters.dateField ?? "created_at");
    setDateValue(filters.dateValue);
  }, [open]);

  useEffect(() => {
    if (dateOpen) setDateInternal(dateValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  const hasFilters = !!(filterName || statuses.length || types.length || natures.length || dateValue);

  const handleClear = () => {
    setFilterName("");
    setStatuses([]);
    setTypes([]);
    setNatures([]);
    setDateField("created_at");
    setDateValue(undefined);
  };

  const handleApply = () => {
    onApply({
      filterName: filterName || undefined,
      status:     statuses.length > 0 ? statuses : undefined,
      types:      types.length   > 0 ? types    : undefined,
      natures:    natures.length > 0 ? natures  : undefined,
      dateField,
      dateValue,
    });
    onClose();
  };

  const typeLabel = types.length === 0
    ? "Todos"
    : types.length === 1
    ? TYPE_OPTIONS.find(t => t.value === types[0])?.label ?? "1 selecionado"
    : `${types.length} selecionados`;

  const natureLabel = natures.length === 0
    ? "Todos"
    : natures.length === 1
    ? NATURE_OPTIONS.find(n => n.value === natures[0])?.label ?? "1 selecionado"
    : `${natures.length} selecionados`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Pesquisa Avançada — Plano de Contas
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">

          {/* Linha 1: Nome(9) + Status(3) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-9 space-y-1.5">
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
                        ? STATUS_OPTIONS.find(s => s.value === statuses[0])?.label
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
                            setTempStatuses(prev => checked ? [...prev, s.value] : prev.filter(v => v !== s.value))
                          }
                        />
                        <Badge variant={s.variant} appearance="light" size="sm">{s.label}</Badge>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempStatuses(statuses); setStatusPopover(false); }}>Cancelar</Button>
                    <Button size="sm" variant="primary" onClick={() => { setStatuses(tempStatuses); setStatusPopover(false); }}>Aplicar</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Linha 2: Pesquisar por(2) + Período(4) + Tipo(3) + Natureza(3) */}
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
              <Label>Tipo</Label>
              <Popover open={typePopover} onOpenChange={(v) => { if (v) setTempTypes(types); setTypePopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">{typeLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {TYPE_OPTIONS.map((t) => (
                      <label key={t.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox
                          checked={tempTypes.includes(t.value)}
                          onCheckedChange={(checked) =>
                            setTempTypes(prev => checked ? [...prev, t.value] : prev.filter(v => v !== t.value))
                          }
                        />
                        <span className="text-sm">{t.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempTypes(types); setTypePopover(false); }}>Cancelar</Button>
                    <Button size="sm" variant="primary" onClick={() => { setTypes(tempTypes); setTypePopover(false); }}>Aplicar</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Natureza</Label>
              <Popover open={naturePopover} onOpenChange={(v) => { if (v) setTempNatures(natures); setNaturePopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">{natureLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {NATURE_OPTIONS.map((n) => (
                      <label key={n.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox
                          checked={tempNatures.includes(n.value)}
                          onCheckedChange={(checked) =>
                            setTempNatures(prev => checked ? [...prev, n.value] : prev.filter(v => v !== n.value))
                          }
                        />
                        <span className="text-sm">{n.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempNatures(natures); setNaturePopover(false); }}>Cancelar</Button>
                    <Button size="sm" variant="primary" onClick={() => { setNatures(tempNatures); setNaturePopover(false); }}>Aplicar</Button>
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
