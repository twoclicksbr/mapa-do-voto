import React, { useMemo, useState, useEffect, useRef } from "react";
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
import { ArrowDownToLine, ChevronDown, ChevronRight, Eye, Pencil } from "lucide-react";
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

interface FinTitlesDataGridProps {
  titles: FinTitle[];
  isLoading: boolean;
  onSelectionChange?: (count: number, allPending: boolean, selectedIds: number[], allSamePeople: boolean, selectedTitles: FinTitle[]) => void;
  onEdit?: (title: FinTitle) => void;
  onBaixar?: (title: FinTitle) => void;
}

export function FinTitlesDataGrid({
  titles,
  isLoading,
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
    "id",
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
  }, [titles]);

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
            <button
              onClick={(e) => { e.stopPropagation(); row.toggleExpanded(); }}
              className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {row.getIsExpanded()
                ? <ChevronDown className="size-4" />
                : <ChevronRight className="size-4" />}
            </button>
          );
        },
        meta: {
          skeleton: <Skeleton className="h-4 w-4" />,
          headerClassName: "w-[3%]",
          cellClassName: "w-[3%]",
          expandedColSpan: 7,
          expandedCellContent: (title: FinTitle) => {
            if (!["paid", "partial", "reversed", "cancelled"].includes(title.status)) return null;
            const parts: React.ReactNode[] = [];
            if (title.bank_name)
              parts.push(<>Banco: <strong>{title.bank_name}</strong></>);
            if (title.account_name)
              parts.push(<>Conta Financeira: <strong>{title.account_name}</strong></>);
            if (title.payment_method_name)
              parts.push(<>Modalidade: <strong>{title.payment_method_name}</strong></>);
            if (!parts.length) return null;
            return (
              <p className="text-xs text-muted-foreground text-right">
                {parts.map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="mx-4 text-muted-foreground/50">|</span>}
                    {part}
                  </React.Fragment>
                ))}
              </p>
            );
          },
          expandedCellContent2: (title: FinTitle) => {
            if (title.status !== "reversed") return null;
            const parts: React.ReactNode[] = [];
            if (title.bank_name)
              parts.push(<>Banco: <strong>{title.bank_name}</strong></>);
            if (title.account_name)
              parts.push(<>Conta Financeira: <strong>{title.account_name}</strong></>);
            if (title.payment_method_name)
              parts.push(<>Modalidade: <strong>{title.payment_method_name}</strong></>);
            if (!parts.length) return null;
            return (
              <p className="text-xs text-muted-foreground text-right">
                {parts.map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="mx-4 text-muted-foreground/50">|</span>}
                    {part}
                  </React.Fragment>
                ))}
              </p>
            );
          },
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
        accessorKey: "id",
        id: "id",
        header: ({ column }) => (
          <DataGridColumnHeader title="ID" column={column} />
        ),
        cell: (info) => (
          <span className="text-muted-foreground font-mono">
            #{String(info.getValue() as number).padStart(5, "0")}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-14" />,
          headerClassName: "w-[7%]",
          cellClassName: "w-[7%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "invoice_number",
        id: "invoice_number",
        header: ({ column }) => (
          <DataGridColumnHeader title="Título" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-sm">
            {row.original.invoice_number ?? (
              <span className="italic text-xs">—</span>
            )}
          </span>
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
          expandedCellContent: (title: FinTitle) => {
            if (!["paid", "partial", "reversed"].includes(title.status)) return null;
            const valorPago = title.amount_paid != null ? fmtBRL(title.amount_paid) : null;
            return valorPago ? (
              <div className="space-y-0.5 text-xs">
                <p className="text-muted-foreground text-left">Valor Pago</p>
                <p className="font-semibold tabular-nums text-right">{valorPago}</p>
              </div>
            ) : null;
          },
          expandedCellContent2: (title: FinTitle) => {
            if (title.status === "reversed" && title.amount_paid != null) {
              return (
                <div className="space-y-0.5 text-xs">
                  <p className="text-muted-foreground text-left">Valor Estornado</p>
                  <p className="font-semibold tabular-nums text-right">{fmtBRL(title.amount_paid)}</p>
                </div>
              );
            }
            return null;
          },
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
          expandedCellContent: (title: FinTitle) => {
            if (!["paid", "partial", "reversed", "cancelled"].includes(title.status)) return null;
            if (title.status === "cancelled") {
              const dataCancelamento = title.cancelled_at ? fmtDate(title.cancelled_at) : null;
              return dataCancelamento ? (
                <div className="space-y-0.5 text-xs">
                  <p className="text-muted-foreground">Data Cancelamento</p>
                  <p className="font-semibold">{dataCancelamento}</p>
                </div>
              ) : null;
            }
            const dataBaixa = title.paid_at ? fmtDate(title.paid_at) : null;
            return dataBaixa ? (
              <div className="space-y-0.5 text-xs">
                <p className="text-muted-foreground">Data Baixa</p>
                <p className="font-semibold">{dataBaixa}</p>
              </div>
            ) : null;
          },
          expandedCellContent2: (title: FinTitle) => {
            if (title.status === "reversed" && title.reversed_at) {
              return (
                <div className="space-y-0.5 text-xs">
                  <p className="text-muted-foreground">Data Estorno</p>
                  <p className="font-semibold">{fmtDate(title.reversed_at)}</p>
                </div>
              );
            }
            return null;
          },
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
                  onClick={() => onEdit?.(row.original)}
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
                    onClick={() => onBaixar?.(row.original)}
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
      tableClassNames={{ edgeCell: "px-5" }}
      tableLayout={{
        width: "auto",
        rowsDraggable: false,
        columnsPinnable: false,
        columnsMovable: false,
        columnsVisibility: false,
      }}
    >
      <div className="w-full space-y-2.5">
        <div className="w-full border rounded-lg">
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <DataGridPagination rowsPerPageLabel="Registros por página" info=" " />
      </div>
    </DataGrid>
  );
}
