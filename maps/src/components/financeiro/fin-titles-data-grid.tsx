import { useMemo, useState, useEffect, useRef } from "react";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  ColumnDef,
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Eye, Pencil, SquareMinusIcon, SquarePlusIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

export interface FinTitle {
  id: number;
  type: "income" | "expense";
  amount: number;
  discount: number | null;
  interest: number | null;
  multa: number | null;
  issue_date: string | null;
  due_date: string;
  paid_at: string | null;
  reversed_at: string | null;
  cancelled_at: string | null;
  amount_paid: number | null;
  installment_number: number | null;
  installment_total: number | null;
  account_id?: number | null;
  account_name?: string | null;
  payment_method_id?: number | null;
  payment_method_name?: string | null;
  bank_id?: number | null;
  bank_name?: string | null;
  people_id: number;
  people_name?: string;
  document_number?: string | null;
  invoice_number?: string | null;
  barcode?: string | null;
  pix_key?: string | null;
  status: "pending" | "paid" | "partial" | "cancelled" | "reversed";
}

const STATUS_LABELS: Record<FinTitle["status"], string> = {
  pending: "Pendente",
  paid: "Pago",
  partial: "Pago Parcial",
  cancelled: "Cancelado",
  reversed: "Estornado",
};

const STATUS_VARIANTS: Record<
  FinTitle["status"],
  "success" | "destructive" | "warning" | "primary" | "info"
> = {
  pending: "primary",
  paid: "success",
  partial: "warning",
  cancelled: "destructive",
  reversed: "info",
};

function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function fmtDate(raw: string): string {
  const [year, month, day] = raw.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function dueDateVariant(raw: string, status: FinTitle["status"]): "destructive" | "warning" | "primary" | "secondary" {
  if (status !== "pending") return "secondary";
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return "destructive";
  if (date.getTime() === today.getTime()) return "warning";
  return "primary";
}

interface EventRow {
  evento: string;
  data: string | null;
  valor: string | null;
  banco: string | null;
  conta: string | null;
  modalidade: string | null;
}

function ExpandedContent({ title }: { title: FinTitle }) {
  const rows = useMemo<EventRow[]>(() => {
    const events: EventRow[] = [];

    if (["paid", "partial", "reversed"].includes(title.status)) {
      events.push({
        evento:     title.status === "partial" ? "Baixa Parcial" : "Baixa",
        data:       title.paid_at       ? fmtDate(title.paid_at)       : null,
        valor:      title.amount_paid   != null ? fmtBRL(title.amount_paid) : null,
        banco:      title.bank_name     ?? null,
        conta:      title.account_name  ?? null,
        modalidade: title.payment_method_name ?? null,
      });
    }

    if (title.status === "reversed") {
      events.push({
        evento:     "Estorno",
        data:       title.reversed_at   ? fmtDate(title.reversed_at)   : null,
        valor:      title.amount_paid   != null ? fmtBRL(title.amount_paid) : null,
        banco:      title.bank_name     ?? null,
        conta:      title.account_name  ?? null,
        modalidade: title.payment_method_name ?? null,
      });
    }

    if (title.status === "cancelled") {
      events.push({
        evento:     "Cancelamento",
        data:       title.cancelled_at  ? fmtDate(title.cancelled_at)  : null,
        valor:      fmtBRL(title.amount),
        banco:      null,
        conta:      null,
        modalidade: null,
      });
    }

    return events;
  }, [title]);

  if (!rows.length) return null;

  const cols: { key: keyof EventRow; label: string; width: string }[] = [
    { key: "banco",      label: "Banco",            width: "22%" },
    { key: "conta",      label: "Conta Financeira", width: "22%" },
    { key: "modalidade", label: "Modalidade",       width: "22%" },
    { key: "evento",     label: "Evento",           width: "14%" },
    { key: "data",       label: "Data",             width: "10%" },
    { key: "valor",      label: "Valor",            width: "10%" },
  ];

  return (
    <div className="bg-background p-4 border-t border-border">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            {cols.map((c) => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <thead className="bg-muted/40">
            <tr className="border-b border-border">
              {cols.map((c) => (
                <th key={c.key} className="px-3 h-9 text-left text-xs font-normal text-secondary-foreground/80 border-e last:border-e-0">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-b-0">
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-sm border-e last:border-e-0">
                    {c.key === "evento"
                      ? <span className="font-semibold">{row[c.key]}</span>
                      : row[c.key] ?? <span className="text-muted-foreground">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface FinTitlesDataGridProps {
  titles: FinTitle[];
  isLoading: boolean;
  clearSelectionKey?: number;
  onSelectionChange?: (count: number, allPending: boolean, selectedIds: number[], allSamePeople: boolean, selectedTitles: FinTitle[]) => void;
  onEdit?: (title: FinTitle) => void;
  onBaixar?: (title: FinTitle) => void;
}

export function FinTitlesDataGrid({
  titles,
  isLoading,
  clearSelectionKey,
  onSelectionChange,
  onEdit,
  onBaixar,
}: FinTitlesDataGridProps) {
  const [data, setData] = useState<FinTitle[]>(titles);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "due_date", desc: false },
  ]);
  const [columnOrder] = useState<string[]>([
    "expand",
    "select",
    "invoice_number",
    "people_name",
    "installment",
    "issue_date",
    "due_date",
    "amount",
    "status",
    "actions",
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [expanded,     setExpanded]     = useState<ExpandedState>({});
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange; });

  useEffect(() => {
    setData(titles);
    setExpanded({});
  }, [titles]);

  useEffect(() => {
    if (clearSelectionKey !== undefined) setRowSelection({});
  }, [clearSelectionKey]);

  useEffect(() => {
    const selectedKeys = Object.keys(rowSelection);
    const count = selectedKeys.length;
    const selectedIds = selectedKeys.map(Number);
    const selectedTitles = selectedKeys.map(id => data.find(d => String(d.id) === id)).filter(Boolean) as FinTitle[];
    const allPending = count > 0 && selectedTitles.every(t => t.status === 'pending');
    const peopleIds = new Set(selectedTitles.map(t => t.people_id));
    const allSamePeople = count > 0 && peopleIds.size === 1;
    onSelectionChangeRef.current?.(count, allPending, selectedIds, allSamePeople, selectedTitles);
  }, [rowSelection, data]);

  const columns = useMemo<ColumnDef<FinTitle>[]>(
    () => [
      {
        id: "expand",
        header: () => null,
        cell: ({ row }) => {
          const hasPay = ["paid", "partial", "reversed", "cancelled"].includes(row.original.status);
          if (!hasPay) return null;
          return (
            <Button
              onClick={(e) => { e.stopPropagation(); row.toggleExpanded(); }}
              size="icon"
              variant="ghost"
              className="opacity-70 hover:bg-transparent hover:opacity-100"
            >
              {row.getIsExpanded()
                ? <SquareMinusIcon className="size-3.5" />
                : <SquarePlusIcon className="size-3.5" />}
            </Button>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-4 w-4" />,
          headerClassName: "w-[3%]",
          cellClassName: "w-[3%]",
          expandedContent: (title: FinTitle) => <ExpandedContent title={title} />,
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Selecionar todos"
            className="border-2 border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
            className="border-2 border-gray-300"
          />
        ),
        meta: {
          skeleton: <Skeleton className="h-4 w-4" />,
          headerClassName: "w-[3%]",
          cellClassName: "w-[3%]",
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "invoice_number",
        id: "invoice_number",
        header: ({ column }) => (
          <DataGridColumnHeader title="Título" column={column} />
        ),
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(row.original); }}
            className="font-mono text-sm text-blue-600 hover:underline underline-offset-2"
          >
            {row.original.invoice_number ?? (
              <span className="italic text-xs text-muted-foreground">—</span>
            )}
          </button>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-16" />,
          headerClassName: "w-[8%]",
          cellClassName: "w-[8%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "people_name",
        id: "people_name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Pessoa" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.people_name ?? (
              <span className="text-muted-foreground italic text-xs">—</span>
            )}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-32" />,
          headerClassName: "w-auto",
          cellClassName: "w-auto",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: "installment",
        header: ({ column }) => (
          <DataGridColumnHeader title="Parcela" column={column} />
        ),
        cell: ({ row }) => {
          const { installment_number: num, installment_total: total } =
            row.original;
          if (!num) {
            return (
              <span className="text-muted-foreground text-xs italic">—</span>
            );
          }
          return (
            <Badge variant="secondary" appearance="light" className="font-mono">
              {total ? `${num}/${total}` : num}
            </Badge>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-5 w-12" />,
          headerClassName: "w-[8%]",
          cellClassName: "w-[8%]",
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "issue_date",
        id: "issue_date",
        header: ({ column }) => (
          <DataGridColumnHeader title="Emissão" column={column} />
        ),
        cell: ({ row }) => {
          const raw = row.original.issue_date;
          if (!raw) return <span className="text-muted-foreground text-xs italic">—</span>;
          return <Badge variant="secondary" appearance="light" className="tabular-nums font-normal">{fmtDate(raw)}</Badge>;
        },
        meta: {
          skeleton: <Skeleton className="h-5 w-24" />,
          headerClassName: "w-[8%]",
          cellClassName: "w-[8%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "amount",
        id: "amount",
        header: ({ column }) => (
          <DataGridColumnHeader title="Valor" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums block text-right">
            {fmtBRL(row.original.amount)}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-24" />,
          headerClassName: "w-[8%]",
          cellClassName: "w-[8%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "due_date",
        id: "due_date",
        header: ({ column }) => (
          <DataGridColumnHeader title="Vencimento" column={column} />
        ),
        cell: ({ row }) => {
          const raw = row.original.due_date;
          const variant = dueDateVariant(raw, row.original.status);
          const [year, month, day] = raw.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
          return (
            <Badge variant={variant} appearance="light">
              {fmtDate(raw)}
              {variant === "destructive" && ` (${diffDays} ${diffDays === 1 ? "dia" : "dias"})`}
            </Badge>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-5 w-24" />,
          headerClassName: "w-[12%]",
          cellClassName: "w-[12%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge variant={STATUS_VARIANTS[s]} appearance="light">
              {STATUS_LABELS[s]}
            </Badge>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-6 w-20" />,
          headerClassName: "w-[10%]",
          cellClassName: "w-[10%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: "actions",
        header: () => (
          <span className="text-muted-foreground text-sm w-full block text-right">
            Ações
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                  onClick={(e) => { e.stopPropagation(); onEdit?.(row.original); }}
                >
                  {row.original.status === "pending" ? <Pencil className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{row.original.status === "pending" ? "Editar" : "Visualizar"}</TooltipContent>
            </Tooltip>
            {row.original.status === "pending" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                    onClick={(e) => { e.stopPropagation(); onBaixar?.(row.original); }}
                  >
                    <ArrowDownToLine className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Baixar</TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
        meta: {
          skeleton: <Skeleton className="h-7 w-16" />,
          headerClassName: "w-[8%]",
          cellClassName: "w-[8%]",
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEdit, onBaixar]
  );

  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: FinTitle) => String(row.id),
    getRowCanExpand: (row) => ["paid", "partial", "reversed", "cancelled"].includes(row.original.status),
    state: { pagination, sorting, columnOrder, rowSelection, expanded },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={data?.length || 0}
      isLoading={isLoading}
      onRowClick={(title: FinTitle) => table.getRow(String(title.id))?.toggleSelected()}
      tableClassNames={{ edgeCell: "px-5", bodyRow: "cursor-default" }}
      tableLayout={{
        width: "auto",
        stripped: true,
        rowsDraggable: false,
        columnsPinnable: false,
        columnsMovable: false,
        columnsVisibility: false,
        headerSticky: true,
      }}
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
          <ScrollArea className="h-full">
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <div className="shrink-0 mt-2">
          <DataGridPagination rowsPerPageLabel="Registros por página" info=" " />
        </div>
      </div>
    </DataGrid>
  );
}
