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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateSelector, formatDateValue, type DateSelectorValue, type DateSelectorI18nConfig } from "@/components/reui/date-selector";
import { Search, CalendarIcon, ChevronDown, X, User } from "lucide-react";
import api from "@/lib/api";

// ─── i18n ─────────────────────────────────────────────────────────────────────

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

// ─── Options ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "aberto",       label: "Aberto",       variant: "destructive" as const },
  { value: "em_andamento", label: "Em Andamento",  variant: "warning"     as const },
  { value: "resolvido",    label: "Resolvido",     variant: "success"     as const },
];

const PRIORITY_OPTIONS = [
  { value: "alta",  label: "Alta",  variant: "destructive" as const },
  { value: "media", label: "Média", variant: "warning"     as const },
  { value: "baixa", label: "Baixa", variant: "secondary"   as const },
];

const DATE_FIELD_LABELS: Record<string, string> = {
  opened_at:  "Abertura",
  resolved_at: "Resolução",
  created_at: "Criado em",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceFilters {
  filterTitle?:    string;
  peopleId?:       number;
  peopleName?:     string;
  statuses?:       string[];
  priorities?:     string[];
  dateField?:      string;
  dateValue?:      DateSelectorValue;
}

interface AttendanceFilterModalProps {
  open: boolean;
  filters: AttendanceFilters;
  onClose: () => void;
  onApply: (filters: AttendanceFilters) => void;
}

interface RefPerson { id: number; name: string }

// ─── Component ────────────────────────────────────────────────────────────────

export function AttendanceFilterModal({ open, filters, onClose, onApply }: AttendanceFilterModalProps) {
  const [filterTitle,    setFilterTitle]   = useState("");
  const [peopleId,       setPeopleId]      = useState<number | null>(null);
  const [peopleName,     setPeopleName]    = useState("");
  const [peopleSearch,   setPeopleSearch]  = useState("");
  const [peopleOptions,  setPeopleOptions] = useState<RefPerson[]>([]);
  const [peopleOpen,     setPeopleOpen]    = useState(false);
  const [statuses,       setStatuses]      = useState<string[]>([]);
  const [statusPopover,  setStatusPopover] = useState(false);
  const [tempStatuses,   setTempStatuses]  = useState<string[]>([]);
  const [priorities,     setPriorities]    = useState<string[]>([]);
  const [priorityPopover, setPriorityPopover] = useState(false);
  const [tempPriorities, setTempPriorities] = useState<string[]>([]);
  const [dateField,      setDateField]     = useState("opened_at");
  const [dateValue,      setDateValue]     = useState<DateSelectorValue | undefined>();
  const [dateOpen,       setDateOpen]      = useState(false);
  const [dateInternal,   setDateInternal]  = useState<DateSelectorValue | undefined>();

  useEffect(() => {
    if (!open) return;
    setFilterTitle(filters.filterTitle ?? "");
    setPeopleId(filters.peopleId ?? null);
    setPeopleName(filters.peopleName ?? "");
    setPeopleSearch(filters.peopleName ?? "");
    setStatuses(filters.statuses ?? []);
    setPriorities(filters.priorities ?? []);
    setDateField(filters.dateField ?? "opened_at");
    setDateValue(filters.dateValue);
    setPeopleOptions([]);
  }, [open]);

  useEffect(() => {
    if (dateOpen) setDateInternal(dateValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  // People autocomplete
  useEffect(() => {
    if (!peopleSearch.trim() || peopleSearch === peopleName) {
      setPeopleOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await api.get<RefPerson[]>("/people", { params: { q: peopleSearch } });
      setPeopleOptions(res.data.slice(0, 10));
    }, 250);
    return () => clearTimeout(t);
  }, [peopleSearch, peopleName]);

  const hasFilters = !!(filterTitle || peopleId || statuses.length || priorities.length || dateValue);

  const handleClear = () => {
    setFilterTitle("");
    setPeopleId(null);
    setPeopleName("");
    setPeopleSearch("");
    setStatuses([]);
    setPriorities([]);
    setDateField("opened_at");
    setDateValue(undefined);
  };

  const handleApply = () => {
    onApply({
      filterTitle: filterTitle || undefined,
      peopleId:    peopleId ?? undefined,
      peopleName:  peopleName || undefined,
      statuses:    statuses.length > 0 ? statuses : undefined,
      priorities:  priorities.length > 0 ? priorities : undefined,
      dateField,
      dateValue,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Pesquisa Avançada — Atendimentos
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">

          {/* Linha 1: Título(6) + Pessoa(4) + Status(2) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Digite para buscar..." value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label>Pessoa Atendida</Label>
              <div className="relative">
                <Input
                  value={peopleSearch}
                  onChange={(e) => { setPeopleSearch(e.target.value); setPeopleId(null); setPeopleName(""); setPeopleOpen(true); }}
                  onFocus={() => setPeopleOpen(true)}
                  placeholder="Buscar eleitor..."
                />
                {peopleId && (
                  <button type="button" onClick={() => { setPeopleId(null); setPeopleName(""); setPeopleSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
                {peopleOpen && peopleOptions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-44 overflow-y-auto">
                    {peopleOptions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setPeopleId(p.id);
                          setPeopleName(p.name);
                          setPeopleSearch(p.name);
                          setPeopleOpen(false);
                          setPeopleOptions([]);
                        }}
                      >
                        <User className="size-3.5 text-muted-foreground" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Popover open={statusPopover} onOpenChange={(v) => { if (v) setTempStatuses(statuses); setStatusPopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">
                      {statuses.length === 0 ? "Todos" : statuses.length === 1 ? STATUS_OPTIONS.find((s) => s.value === statuses[0])?.label : `${statuses.length} sel.`}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {STATUS_OPTIONS.map((s) => (
                      <label key={s.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox checked={tempStatuses.includes(s.value)} onCheckedChange={(checked) => setTempStatuses((prev) => checked ? [...prev, s.value] : prev.filter((v) => v !== s.value))} />
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

          {/* Linha 2: Pesquisar por(2) + Período(4) + Prioridade(3) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Pesquisar por</Label>
              <Select value={dateField} onValueChange={(v) => { setDateField(v); setDateValue(undefined); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened_at">Abertura</SelectItem>
                  <SelectItem value="resolved_at">Resolução</SelectItem>
                  <SelectItem value="created_at">Criado em</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label>Período</Label>
              <div className="relative">
                <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                  <button type="button" onClick={() => setDateOpen(true)} className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate pr-5">
                      {dateValue ? formatDateValue(dateValue, DATE_SELECTOR_I18N, "dd/MM/yyyy") : "Selecionar período"}
                    </span>
                  </button>
                  <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>{DATE_FIELD_LABELS[dateField] ?? "Período"}</DialogTitle>
                    </DialogHeader>
                    <DateSelector value={dateInternal} onChange={setDateInternal} showInput={true} i18n={DATE_SELECTOR_I18N} dayDateFormat="dd/MM/yyyy" />
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                      <Button variant="primary" onClick={() => { setDateValue(dateInternal); setDateOpen(false); }}>Aplicar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {dateValue && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDateValue(undefined); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Prioridade</Label>
              <Popover open={priorityPopover} onOpenChange={(v) => { if (v) setTempPriorities(priorities); setPriorityPopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">
                      {priorities.length === 0 ? "Todas" : priorities.length === 1 ? PRIORITY_OPTIONS.find((p) => p.value === priorities[0])?.label : `${priorities.length} sel.`}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {PRIORITY_OPTIONS.map((p) => (
                      <label key={p.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                        <Checkbox checked={tempPriorities.includes(p.value)} onCheckedChange={(checked) => setTempPriorities((prev) => checked ? [...prev, p.value] : prev.filter((v) => v !== p.value))} />
                        <Badge variant={p.variant} appearance="light" size="sm">{p.label}</Badge>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempPriorities(priorities); setPriorityPopover(false); }}>Cancelar</Button>
                    <Button size="sm" variant="primary" onClick={() => { setPriorities(tempPriorities); setPriorityPopover(false); }}>Aplicar</Button>
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
          <Button variant="primary" onClick={handleApply}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
