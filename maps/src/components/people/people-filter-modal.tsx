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
import { PhoneInput } from "@/components/reui/phone-input";
import type { Value as PhoneValue } from "react-phone-number-input";
import api from "@/lib/api";

function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, "");
  const masks = mask.split("|");
  const selected = masks.reduce((best, m) => {
    const mDigits = (m.match(/9/g) ?? []).length;
    const bDigits = (best.match(/9/g) ?? []).length;
    if (digits.length <= mDigits && mDigits < bDigits) return m;
    return best;
  }, masks[masks.length - 1]);
  let result = "";
  let di = 0;
  for (let i = 0; i < selected.length && di < digits.length; i++) {
    result += selected[i] === "9" ? digits[di++] : selected[i];
  }
  return result;
}

interface RefPerson     { id: number; name: string }
interface RefTypePeople { id: number; name: string }
interface RefTypeContact  { id: number; name: string; mask: string | null }
interface RefTypeDocument { id: number; name: string; mask: string | null }
interface RefTypeAddress  { id: number; name: string }

export interface PeopleFilters {
  filterId?:       string;
  peopleId?:       number;
  peopleName?:     string;
  typePeopleIds?:  number[];
  status?:         string[];
  dateField?:      string;
  dateValue?:      DateSelectorValue;
  birthDateValue?: DateSelectorValue;
  contactTypeId?:   number;
  contactTypeName?: string;
  contactValue?:    string;
  docTypeId?:       number;
  docTypeName?:     string;
  docValue?:        string;
  addrTypeId?:      number;
  addrTypeName?:    string;
  addrValue?:       string;
}

const DATE_FIELD_LABELS: Record<string, string> = {
  created_at: "Criado em",
  updated_at: "Editado em",
  deleted_at: "Deletado em",
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

const STATUS_OPTIONS: { value: string; label: string; variant: "success" | "destructive" }[] = [
  { value: "active",   label: "Ativo",   variant: "success" },
  { value: "inactive", label: "Inativo", variant: "destructive" },
];

interface PeopleFilterModalProps {
  open: boolean;
  filters: PeopleFilters;
  onClose: () => void;
  onApply: (filters: PeopleFilters) => void;
}

export function PeopleFilterModal({ open, filters, onClose, onApply }: PeopleFilterModalProps) {
  const [filterId,       setFilterId]       = useState("");
  const [peopleId,       setPeopleId]       = useState<number | undefined>();
  const [peopleQuery,    setPeopleQuery]    = useState("");
  const [showPeopleDrop, setShowPeopleDrop] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [people,         setPeople]         = useState<RefPerson[]>([]);
  const [typePeopleIds,    setTypePeopleIds]    = useState<number[]>([]);
  const [typePopover,      setTypePopover]      = useState(false);
  const [tempTypePeopleIds,setTempTypePeopleIds] = useState<number[]>([]);
  const [statuses,       setStatuses]       = useState<string[]>([]);
  const [statusPopover,  setStatusPopover]  = useState(false);
  const [tempStatuses,   setTempStatuses]   = useState<string[]>([]);
  const [dateField,      setDateField]      = useState("created_at");
  const [dateValue,      setDateValue]      = useState<DateSelectorValue | undefined>();
  const [dateOpen2,      setDateOpen2]      = useState(false);
  const [dateInternal2,  setDateInternal2]  = useState<DateSelectorValue | undefined>();
  const [birthDateValue, setBirthDateValue] = useState<DateSelectorValue | undefined>();
  const [dateOpen,       setDateOpen]       = useState(false);
  const [dateInternal,   setDateInternal]   = useState<DateSelectorValue | undefined>();
  const [typePeople,     setTypePeople]     = useState<RefTypePeople[]>([]);
  const [typeContacts,   setTypeContacts]   = useState<RefTypeContact[]>([]);
  const [contactTypeId,  setContactTypeId]  = useState<number | undefined>();
  const [contactValue,   setContactValue]   = useState("");
  const [typeDocuments,  setTypeDocuments]  = useState<RefTypeDocument[]>([]);
  const [docTypeId,      setDocTypeId]      = useState<number | undefined>();
  const [docValue,       setDocValue]       = useState("");
  const [typeAddresses,  setTypeAddresses]  = useState<RefTypeAddress[]>([]);
  const [addrTypeId,     setAddrTypeId]     = useState<number | undefined>();
  const [addrValue,      setAddrValue]      = useState("");
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setFilterId(filters.filterId ?? "");
    setPeopleId(filters.peopleId);
    setPeopleQuery(filters.peopleName ?? "");
    setTypePeopleIds(filters.typePeopleIds ?? []);
    setStatuses(filters.status ?? []);
    setDateField(filters.dateField ?? "created_at");
    setDateValue(filters.dateValue);
    setBirthDateValue(filters.birthDateValue);
    setContactTypeId(filters.contactTypeId);
    setContactValue(filters.contactValue ?? "");
    setDocTypeId(filters.docTypeId);
    setDocValue(filters.docValue ?? "");
    setAddrTypeId(filters.addrTypeId);
    setAddrValue(filters.addrValue ?? "");
    api.get<RefPerson[]>("/people").then((r) => setPeople(r.data)).catch(() => {});
    api.get<RefTypePeople[]>("/type-people").then((r) => setTypePeople(r.data)).catch(() => {});
    api.get<RefTypeContact[]>("/type-contacts").then((r) => setTypeContacts(r.data)).catch(() => {});
    api.get<RefTypeDocument[]>("/type-documents").then((r) => setTypeDocuments(r.data)).catch(() => {});
    api.get<RefTypeAddress[]>("/type-addresses").then((r) => setTypeAddresses(r.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (dateOpen2) setDateInternal2(dateValue ?? { period: "day", operator: "between" });
  }, [dateOpen2]);

  useEffect(() => {
    if (dateOpen) setDateInternal(birthDateValue ?? { period: "day", operator: "between" });
  }, [dateOpen]);

  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(peopleQuery.toLowerCase())
  );

  const hasFilters = !!(filterId || peopleId || typePeopleIds.length || statuses.length || dateValue || birthDateValue || contactTypeId || contactValue || docTypeId || docValue || addrTypeId || addrValue);

  const handleClear = () => {
    setFilterId("");
    setPeopleId(undefined);
    setPeopleQuery("");
    setTypePeopleIds([]);
    setStatuses([]);
    setDateField("created_at");
    setDateValue(undefined);
    setBirthDateValue(undefined);
    setContactTypeId(undefined);
    setContactValue("");
    setDocTypeId(undefined);
    setDocValue("");
    setAddrTypeId(undefined);
    setAddrValue("");
  };

  const handleApply = () => {
    onApply({
      filterId:       filterId || undefined,
      peopleId:       peopleId,
      peopleName:     peopleId ? peopleQuery : undefined,
      typePeopleIds:  typePeopleIds.length > 0 ? typePeopleIds : undefined,
      status:         statuses.length > 0 ? statuses : undefined,
      dateField:        dateField,
      dateValue:        dateValue,
      birthDateValue:   birthDateValue,
      contactTypeId:    contactTypeId,
      contactTypeName:  contactTypeId ? typeContacts.find(tc => tc.id === contactTypeId)?.name : undefined,
      contactValue:     contactValue || undefined,
      docTypeId:        docTypeId,
      docTypeName:      docTypeId ? typeDocuments.find(td => td.id === docTypeId)?.name : undefined,
      docValue:         docValue || undefined,
      addrTypeId:       addrTypeId,
      addrTypeName:     addrTypeId ? typeAddresses.find(ta => ta.id === addrTypeId)?.name : undefined,
      addrValue:        addrValue || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Pesquisa Avançada — Pessoas
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            {/* ID */}
            <div className="col-span-2 space-y-1.5">
              <Label>ID</Label>
              <Input
                value={filterId}
                onChange={(e) => setFilterId(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 1"
                inputMode="numeric"
              />
            </div>

            {/* Nome */}
            <div className="col-span-8 space-y-1.5">
              <Label>Nome</Label>
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
          <div className="grid grid-cols-4 gap-4">
            {/* Pesquisar por */}
            <div className="space-y-1.5">
              <Label>Pesquisar por</Label>
              <Select value={dateField} onValueChange={(v) => { setDateField(v); setDateValue(undefined); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Criado em</SelectItem>
                  <SelectItem value="updated_at">Editado em</SelectItem>
                  <SelectItem value="deleted_at">Deletado em</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-1.5">
              <Label>Período</Label>
              <div className="relative">
                <Dialog open={dateOpen2} onOpenChange={setDateOpen2}>
                  <button
                    type="button"
                    onClick={() => setDateOpen2(true)}
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
                      value={dateInternal2}
                      onChange={setDateInternal2}
                      showInput={true}
                      i18n={DATE_SELECTOR_I18N}
                      dayDateFormat="dd/MM/yyyy"
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button variant="primary" onClick={() => { setDateValue(dateInternal2); setDateOpen2(false); }}>
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

            {/* Tipo de Pessoa */}
            <div className="space-y-1.5">
              <Label>Tipo de Pessoa</Label>
              <Popover open={typePopover} onOpenChange={(v) => { if (v) setTempTypePeopleIds(typePeopleIds); setTypePopover(v); }}>
                <PopoverTrigger asChild>
                  <button className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors">
                    <span className="text-muted-foreground truncate">
                      {typePeopleIds.length === 0
                        ? "Todos"
                        : typePeopleIds.length === 1
                        ? typePeople.find((t) => t.id === typePeopleIds[0])?.name
                        : `${typePeopleIds.length} selecionados`}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    {typePeople.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
                        <Checkbox
                          checked={tempTypePeopleIds.includes(t.id)}
                          onCheckedChange={(checked) =>
                            setTempTypePeopleIds((prev) =>
                              checked ? [...prev, t.id] : prev.filter((v) => v !== t.id)
                            )
                          }
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => { setTempTypePeopleIds(typePeopleIds); setTypePopover(false); }}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => { setTypePeopleIds(tempTypePeopleIds); setTypePopover(false); }}>
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Aniversário */}
            <div className="space-y-1.5">
              <Label>Aniversário</Label>
              <div className="relative">
                <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                  <button
                    type="button"
                    onClick={() => setDateOpen(true)}
                    className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors"
                  >
                    <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate pr-5">
                      {birthDateValue ? formatDateValue(birthDateValue, DATE_SELECTOR_I18N, "dd/MM/yyyy") : "Selecionar período"}
                    </span>
                  </button>
                  <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>Aniversário</DialogTitle>
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
                      <Button variant="primary" onClick={() => { setBirthDateValue(dateInternal); setDateOpen(false); }}>
                        Aplicar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {birthDateValue && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBirthDateValue(undefined); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Linha 3 — Contato */}
          {(() => {
            const selectedContact = typeContacts.find((tc) => tc.id === contactTypeId);
            const isWhatsApp = selectedContact?.name?.toLowerCase() === "whatsapp";
            const mask = selectedContact?.mask ?? null;
            return (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <Label>Tipo de Contato</Label>
                  <Select
                    value={contactTypeId !== undefined ? String(contactTypeId) : "_all"}
                    onValueChange={(v) => { setContactTypeId(v === "_all" ? undefined : Number(v)); setContactValue(""); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Todos</SelectItem>
                      {typeContacts.map((tc) => (
                        <SelectItem key={tc.id} value={String(tc.id)}>{tc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5 space-y-1.5">
                  <Label>Valor do Contato</Label>
                  {isWhatsApp ? (
                    <PhoneInput
                      placeholder="Número do WhatsApp"
                      value={contactValue as PhoneValue}
                      onChange={(v) => setContactValue(v ?? "")}
                    />
                  ) : (
                    <Input
                      value={contactValue}
                      onChange={(e) => setContactValue(mask ? applyMask(e.target.value, mask) : e.target.value)}
                      placeholder={mask ? mask.replace(/9/g, "0") : "Buscar por valor..."}
                    />
                  )}
                </div>
              </div>
            );
          })()}
          {/* Linha 4 — Documento */}
          {(() => {
            const selectedDoc = typeDocuments.find((td) => td.id === docTypeId);
            const mask = selectedDoc?.mask ?? null;
            return (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={docTypeId !== undefined ? String(docTypeId) : "_all"}
                    onValueChange={(v) => { setDocTypeId(v === "_all" ? undefined : Number(v)); setDocValue(""); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Todos</SelectItem>
                      {typeDocuments.map((td) => (
                        <SelectItem key={td.id} value={String(td.id)}>{td.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5 space-y-1.5">
                  <Label>Número do Documento</Label>
                  <Input
                    value={docValue}
                    onChange={(e) => setDocValue(mask ? applyMask(e.target.value, mask) : e.target.value)}
                    placeholder={mask ? mask.replace(/9/g, "0").split("|")[0] : "Buscar por número..."}
                  />
                </div>
              </div>
            );
          })()}
          {/* Linha 5 — Endereço */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 space-y-1.5">
              <Label>Tipo de Endereço</Label>
              <Select
                value={addrTypeId !== undefined ? String(addrTypeId) : "_all"}
                onValueChange={(v) => { setAddrTypeId(v === "_all" ? undefined : Number(v)); setAddrValue(""); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  {typeAddresses.map((ta) => (
                    <SelectItem key={ta.id} value={String(ta.id)}>{ta.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-5 space-y-1.5">
              <Label>Buscar no Endereço</Label>
              <Input
                value={addrValue}
                onChange={(e) => setAddrValue(e.target.value)}
                placeholder="Logradouro, bairro, cidade, CEP ou UF..."
              />
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
