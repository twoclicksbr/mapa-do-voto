import { useMemo, useState, useEffect } from "react";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

export interface FinTitle {
  id: number;
  type: "income" | "expense";
  description: string;
  amount: number;
  discount: number | null;
  interest: number | null;
  due_date: string;
  paid_at: string | null;
  amount_paid: number | null;
  installment_number: number | null;
  installment_total: number | null;
  people_id: number;
  people_name?: string;
  document_number: string | null;
  invoice_number: string | null;
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
  "success" | "destructive" | "warning" | "primary"
> = {
  pending: "primary",
  paid: "success",
  partial: "warning",
  cancelled: "destructive",
  reversed: "warning",
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

function isOverdue(raw: string): boolean {
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

interface FinTitlesDataGridProps {
  titles: FinTitle[];
  isLoading: boolean;
  onSelectionChange?: (count: number) => void;
  onEdit?: (title: FinTitle) => void;
  onDelete?: (id: number) => void;
}

export function FinTitlesDataGrid({
  titles,
  isLoading,
  onSelectionChange,
  onEdit,
  onDelete,
}: FinTitlesDataGridProps) {
  const [data, setData] = useState<FinTitle[]>(titles);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "due_date", desc: false },
  ]);
  const [columnOrder] = useState<string[]>([
    "select",
    "id",
    "people_name",
    "description",
    "installment",
    "amount",
    "due_date",
    "status",
    "actions",
  ]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    setData(titles);
  }, [titles]);

  useEffect(() => {
    onSelectionChange?.(Object.keys(rowSelection).length);
  }, [rowSelection, onSelectionChange]);

  const columns = useMemo<ColumnDef<FinTitle>[]>(
    () => [
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
          headerClassName: "w-[6%]",
          cellClassName: "w-[6%]",
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
          headerClassName: "w-[18%]",
          cellClassName: "w-[18%]",
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "description",
        id: "description",
        header: ({ column }) => (
          <DataGridColumnHeader title="Descrição" column={column} />
        ),
        cell: ({ row }) => (
          <button
            onClick={() => onEdit?.(row.original)}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-left"
          >
            {row.original.description}
          </button>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-48" />,
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
          if (!num || !total) {
            return (
              <span className="text-muted-foreground text-xs italic">—</span>
            );
          }
          return (
            <span className="font-mono text-sm text-muted-foreground">
              {num}/{total}
            </span>
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
        accessorKey: "amount",
        id: "amount",
        header: ({ column }) => (
          <DataGridColumnHeader title="Valor" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {fmtBRL(row.original.amount)}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-24" />,
          headerClassName: "w-[12%]",
          cellClassName: "w-[12%]",
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
          const overdue =
            row.original.status === "pending" && isOverdue(raw);
          return (
            <span
              className={
                overdue
                  ? "font-medium text-destructive tabular-nums"
                  : "tabular-nums text-muted-foreground"
              }
            >
              {fmtDate(raw)}
            </span>
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
          headerClassName: "w-[12%]",
          cellClassName: "w-[12%]",
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
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                  onClick={() => onDelete?.(row.original.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        ),
        meta: {
          skeleton: <Skeleton className="h-7 w-16" />,
          headerClassName: "w-[10%]",
          cellClassName: "w-[10%]",
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: FinTitle) => String(row.id),
    state: { pagination, sorting, columnOrder, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
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
