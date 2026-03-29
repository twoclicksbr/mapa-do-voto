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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateSelector, formatDateValue, type DateSelectorValue, type DateSelectorI18nConfig } from "@/components/reui/date-selector";
import { Search, CalendarIcon, X } from "lucide-react";

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

export interface PermissionActionsFilters {
  module?:       string;
  filterAction?: string;
  dateField?:    string;
  dateValue?:    DateSelectorValue;
}

interface PermissionActionsFilterModalProps {
  open: boolean;
  filters: PermissionActionsFilters;
  modules: { value: string; label: string }[];
  onClose: () => void;
  onApply: (filters: PermissionActionsFilters) => void;
}

export function PermissionActionsFilterModal({ open, filters, modules, onClose, onApply }: PermissionActionsFilterModalProps) {
  const [module,       setModule]       = useState("all");
  const [filterAction, setFilterAction] = useState("");
  const [dateField,    setDateField]    = useState("created_at");
  const [dateValue,    setDateValue]    = useState<DateSelectorValue | undefined>();
  const [dateOpen,     setDateOpen]     = useState(false);
  const [dateInternal, setDateInternal] = useState<DateSelectorValue | undefined>();

  useEffect(() => {
    if (!open) return;
    setModule(filters.module ?? "all");
    setFilterAction(filters.filterAction ?? "");
    setDateField(filters.dateField ?? "created_at");
    setDateValue(filters.dateValue);
  }, [open]);

  useEffect(() => {
    if (dateOpen) setDateInternal(dateValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  const hasFilters = !!(module !== "all" || filterAction || dateValue);

  const handleClear = () => {
    setModule("all");
    setFilterAction("");
    setDateField("created_at");
    setDateValue(undefined);
  };

  const handleApply = () => {
    onApply({
      module:       module !== "all" ? module : undefined,
      filterAction: filterAction || undefined,
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
            Pesquisa Avançada — Permissões
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">

          {/* Linha 1: Módulo(4) + Ação(8) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 space-y-1.5">
              <Label>Módulo</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-muted-foreground font-mono">({m.value})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-8 space-y-1.5">
              <Label>Ação</Label>
              <Input
                placeholder="Digite para buscar..."
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              />
            </div>
          </div>

          {/* Linha 2: Pesquisar por(2) + Período(4) */}
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
