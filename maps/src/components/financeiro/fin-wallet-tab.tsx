import { useState, useEffect, useRef } from "react";
import { PlusCircle, CalendarIcon, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DateSelector, formatDateValue, type DateSelectorValue, type DateSelectorI18nConfig } from "@/components/reui/date-selector";
import { FinWalletModal } from "./fin-wallet-modal";

interface Person { id: number; name: string; }

interface WalletEntry {
  id:          number;
  people_id:   number;
  people_name: string | null;
  type:        "in" | "out";
  amount:      number;
  date:        string;
  description: string | null;
  title_id:    number | null;
  source:      string;
  created_at:  string;
}

interface WalletResponse {
  entries: WalletEntry[];
  summary: { total_in: number; total_out: number; balance: number };
}

function fmtBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const SOURCE_LABEL: Record<string, string> = {
  manual:  "Manual",
  baixa:   "Baixa",
  estorno: "Estorno",
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

function extractDateRange(v: DateSelectorValue): { dateFrom: string; dateTo: string } {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  if (v.period === "day") {
    const start = v.startDate;
    const end   = v.endDate;
    if (v.operator === "is"      && start) return { dateFrom: fmt(start), dateTo: fmt(start) };
    if (v.operator === "before"  && start) return { dateFrom: "",         dateTo: fmt(start) };
    if (v.operator === "after"   && start) return { dateFrom: fmt(start), dateTo: "" };
    if (v.operator === "between" && start && end) return { dateFrom: fmt(start), dateTo: fmt(end) };
  }

  if (v.period === "month" && v.year != null && v.month != null) {
    const d = new Date(v.year, v.month, 1);
    return { dateFrom: fmt(startOfMonth(d)), dateTo: fmt(endOfMonth(d)) };
  }

  if (v.period === "year" && v.year != null) {
    const d = new Date(v.year, 0, 1);
    return { dateFrom: fmt(startOfYear(d)), dateTo: fmt(endOfYear(d)) };
  }

  // fallback: use startDate/endDate if available
  const s = v.startDate;
  const e = v.endDate ?? v.startDate;
  if (s) return { dateFrom: fmt(s), dateTo: e ? fmt(e) : "" };

  return { dateFrom: "", dateTo: "" };
}

export function FinWalletTab() {
  const [people,         setPeople]         = useState<Person[]>([]);
  const [peopleQuery,    setPeopleQuery]    = useState("");
  const [peopleId,       setPeopleId]       = useState<number | undefined>();
  const [showDrop,       setShowDrop]       = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const [dateValue,    setDateValue]    = useState<DateSelectorValue | undefined>();
  const [dateInternal, setDateInternal] = useState<DateSelectorValue | undefined>();
  const [dateOpen,     setDateOpen]     = useState(false);

  const [entries,     setEntries]     = useState<WalletEntry[]>([]);
  const [summary,     setSummary]     = useState({ total_in: 0, total_out: 0, balance: 0 });
  const [loading,     setLoading]     = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(peopleQuery.toLowerCase())
  );

  useEffect(() => {
    api.get<Person[]>("/people").then(r => setPeople(r.data)).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (peopleId) params.people_id = String(peopleId);
    if (dateValue) {
      const { dateFrom, dateTo } = extractDateRange(dateValue);
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo)   params.date_to   = dateTo;
    }
    api.get<WalletResponse>("/fin-wallets", { params })
      .then(r => { setEntries(r.data.entries); setSummary(r.data.summary); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [peopleId, dateValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-6">

      {/* Header: filtro + botão */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-3 flex-wrap">

          {/* Pessoa */}
          <div className="w-72 space-y-1.5">
            <Label>Pessoa</Label>
            <div className="relative">
              <Input
                value={peopleQuery}
                onChange={e => {
                  setPeopleQuery(e.target.value);
                  setPeopleId(undefined);
                  setShowDrop(true);
                  setHighlightedIdx(-1);
                }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                onKeyDown={e => {
                  if (!showDrop || filteredPeople.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIdx(prev => {
                      const next = Math.min(prev + 1, filteredPeople.length - 1);
                      (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" });
                      return next;
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIdx(prev => {
                      const next = Math.max(prev - 1, 0);
                      (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" });
                      return next;
                    });
                  } else if (e.key === "Enter" && highlightedIdx >= 0) {
                    e.preventDefault();
                    const sel = filteredPeople[highlightedIdx];
                    if (sel) { setPeopleId(sel.id); setPeopleQuery(sel.name); setShowDrop(false); setHighlightedIdx(-1); }
                  } else if (e.key === "Escape") {
                    setShowDrop(false);
                    setHighlightedIdx(-1);
                  }
                }}
                placeholder="Todos (ou digite para filtrar)"
                autoComplete="off"
              />
              {showDrop && peopleQuery.length > 0 && (
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
                        setShowDrop(false);
                        setHighlightedIdx(-1);
                      }}
                      className={`cursor-pointer px-3 py-2 text-sm ${idx === highlightedIdx ? "bg-accent" : "hover:bg-accent"}`}
                    >
                      {p.name}
                    </li>
                  ))}
                  {filteredPeople.length === 0 && (
                    <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {peopleId && (
            <button
              onClick={() => { setPeopleId(undefined); setPeopleQuery(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors pb-0.5"
            >
              Limpar
            </button>
          )}

          {/* Período */}
          <div className="space-y-1.5">
            <Label>Período</Label>
            <div className="relative">
              <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                <button
                  type="button"
                  onClick={() => { setDateInternal(dateValue ?? { period: "day", operator: "between" }); setDateOpen(true); }}
                  className="flex h-9 w-64 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent/50 transition-colors"
                >
                  <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate pr-5">
                    {dateValue ? formatDateValue(dateValue, DATE_SELECTOR_I18N, "dd/MM/yyyy") : "Selecionar período"}
                  </span>
                </button>
                <DialogContent className="sm:max-w-lg" showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>Período</DialogTitle>
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

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          <PlusCircle className="size-4 mr-1.5" />
          Novo Lançamento
        </Button>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-background p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Saídas</p>
          <p className="text-xl font-bold text-red-600 tabular-nums">{fmtBRL(summary.total_out)}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Entradas</p>
          <p className="text-xl font-bold text-green-600 tabular-nums">{fmtBRL(summary.total_in)}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo</p>
          <p className={`text-xl font-bold tabular-nums ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmtBRL(summary.balance)}
          </p>
        </div>
      </div>

      {/* Tabela de lançamentos */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Pessoa</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Descrição</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Origem</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Entrada</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Saída</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">Carregando...</td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum lançamento encontrado.</td>
              </tr>
            )}
            {!loading && entries.map(e => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDate(e.date)}</td>
                <td className="px-4 py-2.5">{e.people_name ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.description ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                    {SOURCE_LABEL[e.source] ?? e.source}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                  {e.type === "in" ? <span className="text-green-600">{fmtBRL(e.amount)}</span> : "—"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                  {e.type === "out" ? <span className="text-red-600">{fmtBRL(e.amount)}</span> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FinWalletModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => load()}
      />
    </div>
  );
}
