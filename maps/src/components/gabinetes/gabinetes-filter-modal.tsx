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
import { DateSelector, formatDateValue, type DateSelectorValue, type DateSelectorI18nConfig } from "@/components/reui/date-selector";
import { Search, CalendarIcon, ChevronDown, X } from "lucide-react";

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

const STATUS_OPTIONS: { value: string; label: string; variant: "success" | "destructive" }[] = [
  { value: "active",   label: "Público", variant: "success" },
  { value: "inactive", label: "Oculto",  variant: "destructive" },
];

export interface GabinetesFilters {
  filterId?:    string;
  filterName?:  string;
  filterSlug?:  string;
  status?:      string[];
  validityValue?: DateSelectorValue;
}

interface GabinetesFilterModalProps {
  open: boolean;
  filters: GabinetesFilters;
  onClose: () => void;
  onApply: (filters: GabinetesFilters) => void;
}

export function GabinetesFilterModal({ open, filters, onClose, onApply }: GabinetesFilterModalProps) {
  const [filterId,      setFilterId]      = useState("");
  const [filterName,    setFilterName]    = useState("");
  const [filterSlug,    setFilterSlug]    = useState("");
  const [statuses,      setStatuses]      = useState<string[]>([]);
  const [statusPopover, setStatusPopover] = useState(false);
  const [tempStatuses,  setTempStatuses]  = useState<string[]>([]);
  const [validityValue, setValidityValue] = useState<DateSelectorValue | undefined>();
  const [dateOpen,      setDateOpen]      = useState(false);
  const [dateInternal,  setDateInternal]  = useState<DateSelectorValue | undefined>();

  useEffect(() => {
    if (!open) return;
    setFilterId(filters.filterId ?? "");
    setFilterName(filters.filterName ?? "");
    setFilterSlug(filters.filterSlug ?? "");
    setStatuses(filters.status ?? []);
    setValidityValue(filters.validityValue);
  }, [open]);

  useEffect(() => {
    if (dateOpen) setDateInternal(validityValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  const hasFilters = !!(filterId || filterName || filterSlug || statuses.length || validityValue);

  const handleClear = () => {
    setFilterId("");
    setFilterName("");
    setFilterSlug("");
    setStatuses([]);
    setValidityValue(undefined);
  };

  const handleApply = () => {
    onApply({
      filterId:     filterId     || undefined,
      filterName:   filterName   || undefined,
      filterSlug:   filterSlug   || undefined,
      status:       statuses.length > 0 ? statuses : undefined,
      validityValue,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Pesquisa Avançada — Gabinetes
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">

          {/* Linha 1: ID(2) + Nome(5) + Subdomínio(3) + Status(2) */}
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
            <div className="col-span-5 space-y-1.5">
              <Label>Nome</Label>
              <Input
                placeholder="Digite para buscar..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Subdomínio</Label>
              <Input
                placeholder="Ex: master"
                value={filterSlug}
                onChange={(e) => setFilterSlug(e.target.value)}
              />
            </div>
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

          {/* Linha 2: Validade(4) */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 space-y-1.5">
              <Label>Validade</Label>
              <div className="relative">
                <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                  <button
                    type="button"
                    onClick={() => setDateOpen(true)}
                    className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors"
                  >
                    <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate pr-5">
                      {validityValue ? formatDateValue(validityValue, DATE_SELECTOR_I18N, "dd/MM/yyyy") : "Selecionar período"}
                    </span>
                  </button>
                  <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>Validade</DialogTitle>
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
                      <Button variant="primary" onClick={() => { setValidityValue(dateInternal); setDateOpen(false); }}>
                        Aplicar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {validityValue && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setValidityValue(undefined); }}
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
