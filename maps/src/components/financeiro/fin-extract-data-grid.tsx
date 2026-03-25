import React, { useMemo, useState } from "react";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutList, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const EXTRACT_VIEW_KEY = "mapadovoto:extractView";

export interface FinExtractEntry {
  id: number;
  title_id: number | null;
  title_description: string | null;
  people_id: number | null;
  people_name: string | null;
  account_id: number | null;
  account_name: string | null;
  type: "in" | "out";
  amount: number;
  date: string;
  payment_method_id: number | null;
  payment_method_name: string | null;
  bank_id: number | null;
  bank_name: string | null;
  source: "manual" | "baixa" | "estorno";
  created_at: string;
}

const SOURCE_LABELS: Record<FinExtractEntry["source"], string> = {
  manual: "Manual",
  baixa: "Baixa",
  estorno: "Estorno",
};

const SOURCE_VARIANTS: Record<
  FinExtractEntry["source"],
  "primary" | "success" | "warning"
> = {
  manual: "primary",
  baixa: "success",
  estorno: "warning",
};

function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function fmtDate(raw: string): string {
  if (!raw) return "—";
  const [y, m, d] = raw.split("-");
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Totalizadores
// ---------------------------------------------------------------------------

interface Totals {
  totalIn: number;
  totalOut: number;
  saldo: number;
}

interface ModalityTotal {
  name: string;
  totalIn: number;
  totalOut: number;
  saldo: number;
}

function calcTotals(entries: FinExtractEntry[]): Totals {
  const totalIn = entries.filter((e) => e.type === "in").reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.type === "out").reduce((s, e) => s + e.amount, 0);
  return { totalIn, totalOut, saldo: totalIn - totalOut };
}

function calcModalityTotals(entries: FinExtractEntry[]): ModalityTotal[] {
  const map = new Map<string, ModalityTotal>();

  for (const e of entries) {
    const key = e.payment_method_name ?? "Sem modalidade";
    if (!map.has(key)) map.set(key, { name: key, totalIn: 0, totalOut: 0, saldo: 0 });
    const m = map.get(key)!;
    if (e.type === "in") m.totalIn += e.amount;
    else m.totalOut += e.amount;
    m.saldo = m.totalIn - m.totalOut;
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

// ---------------------------------------------------------------------------
// Footer de totais
// ---------------------------------------------------------------------------

function ExtractFooter({ entries }: { entries: FinExtractEntry[] }) {
  const general = useMemo(() => calcTotals(entries), [entries]);
  const byModality = useMemo(() => calcModalityTotals(entries), [entries]);

  return (
    <div className="border-t border-border bg-muted/30 px-6 py-4 space-y-4">
      {/* Totais gerais */}
      <div className="flex items-center gap-6 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Geral</span>
        <span className="text-sm">
          <span className="text-muted-foreground mr-1.5">Entradas:</span>
          <span className="font-semibold text-green-600">{fmtBRL(general.totalIn)}</span>
        </span>
        <span className="text-sm">
          <span className="text-muted-foreground mr-1.5">Saídas:</span>
          <span className="font-semibold text-red-600">{fmtBRL(general.totalOut)}</span>
        </span>
        <span className="text-sm">
          <span className="text-muted-foreground mr-1.5">Saldo:</span>
          <span className={`font-semibold ${general.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmtBRL(general.saldo)}
          </span>
        </span>
      </div>

      {/* Totais por modalidade */}
      {byModality.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por Modalidade</span>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-1">
            {byModality.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="text-green-600">+{fmtBRL(m.totalIn)}</span>
                <span className="text-red-600">−{fmtBRL(m.totalOut)}</span>
                <span className={`font-semibold ${m.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ={fmtBRL(m.saldo)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline view
// ---------------------------------------------------------------------------

function TimelineView({ entries }: { entries: FinExtractEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Nenhum lançamento encontrado.
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-0">
      {/* linha vertical */}
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />

      {entries.map((entry) => (
        <div key={entry.id} className="relative flex gap-4 py-3">
          {/* dot */}
          <div
            className={`absolute left-0 top-4 w-3.5 h-3.5 rounded-full border-2 border-background ring-2 ${
              entry.type === "in"
                ? "bg-green-500 ring-green-200"
                : "bg-red-500 ring-red-200"
            }`}
            style={{ transform: "translateX(-0.25rem)" }}
          />

          {/* conteúdo */}
          <div className="flex-1 min-w-0 bg-background border border-border rounded-lg px-4 py-2.5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.title_description ?? "Lançamento manual"}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{fmtDate(entry.date)}</span>
                  {entry.account_name && (
                    <span className="text-xs text-muted-foreground">· {entry.account_name}</span>
                  )}
                  {entry.bank_name && (
                    <span className="text-xs text-muted-foreground">· {entry.bank_name}</span>
                  )}
                  {entry.payment_method_name && (
                    <span className="text-xs text-muted-foreground">· {entry.payment_method_name}</span>
                  )}
                  <Badge variant={SOURCE_VARIANTS[entry.source]} appearance="light" size="xs">
                    {SOURCE_LABELS[entry.source]}
                  </Badge>
                </div>
              </div>
              <span
                className={`text-sm font-semibold whitespace-nowrap ${
                  entry.type === "in" ? "text-green-600" : "text-red-600"
                }`}
              >
                {entry.type === "in" ? "+" : "−"}{fmtBRL(entry.amount)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid view (TanStack)
// ---------------------------------------------------------------------------

function GridView({
  entries,
  isLoading,
}: {
  entries: FinExtractEntry[];
  isLoading: boolean;
}) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const columns = useMemo<ColumnDef<FinExtractEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => <DataGridColumnHeader title="Data" column={column} />,
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">{fmtDate(getValue<string>())}</span>
        ),
        size: 100,
      },
      {
        accessorKey: "people_name",
        header: ({ column }) => <DataGridColumnHeader title="Pessoa" column={column} />,
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v
            ? <span className="text-sm">{v}</span>
            : <span className="text-sm text-muted-foreground italic">—</span>;
        },
        size: 240,
      },
      {
        accessorKey: "account_name",
        header: ({ column }) => <DataGridColumnHeader title="Conta" column={column} />,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
        ),
        size: 160,
      },
      {
        accessorKey: "bank_name",
        header: ({ column }) => <DataGridColumnHeader title="Banco" column={column} />,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
        ),
        size: 140,
      },
      {
        accessorKey: "payment_method_name",
        header: ({ column }) => <DataGridColumnHeader title="Modalidade" column={column} />,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
        ),
        size: 140,
      },
      {
        accessorKey: "source",
        header: ({ column }) => <DataGridColumnHeader title="Origem" column={column} />,
        cell: ({ getValue }) => {
          const src = getValue<FinExtractEntry["source"]>();
          return (
            <Badge variant={SOURCE_VARIANTS[src]} appearance="light" size="sm">
              {SOURCE_LABELS[src]}
            </Badge>
          );
        },
        size: 100,
      },
      {
        id: "valor_in",
        header: ({ column }) => <DataGridColumnHeader title="Entrada" column={column} className="text-green-600" />,
        accessorFn: (row) => (row.type === "in" ? row.amount : null),
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return v != null ? (
            <span className="text-sm font-medium text-green-600 tabular-nums">{fmtBRL(v)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
        size: 130,
      },
      {
        id: "valor_out",
        header: ({ column }) => <DataGridColumnHeader title="Saída" column={column} className="text-red-600" />,
        accessorFn: (row) => (row.type === "out" ? row.amount : null),
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return v != null ? (
            <span className="text-sm font-medium text-red-600 tabular-nums">{fmtBRL(v)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
        size: 130,
      },
    ],
    []
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: { pagination, sorting },
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <DataGrid table={table} recordCount={entries.length}>
      <div className="overflow-x-auto">
        <DataGridTable />
      </div>
    </DataGrid>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export type ExtractView = "grid" | "timeline";

interface FinExtractDataGridProps {
  entries: FinExtractEntry[];
  isLoading: boolean;
  view: ExtractView;
}

export function FinExtractDataGrid({ entries, isLoading, view }: FinExtractDataGridProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {view === "timeline" ? (
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <TimelineView entries={entries} />
          )}
        </div>
      ) : (
        <GridView entries={entries} isLoading={isLoading} />
      )}
      <ExtractFooter entries={entries} />
    </div>
  );
}

// Toggle buttons — exportado para uso no cabeçalho do painel
export function ExtractViewToggle({
  view,
  onChange,
}: {
  view: ExtractView;
  onChange: (v: ExtractView) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "grid" ? "primary" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange("grid")}
          >
            <LayoutList className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Grid</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={view === "timeline" ? "primary" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange("timeline")}
          >
            <Clock className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Linha do tempo</TooltipContent>
      </Tooltip>
    </div>
  );
}
