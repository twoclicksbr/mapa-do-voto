import { useMemo, useState, useEffect } from "react";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import {
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid/data-grid-table-dnd-rows";
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
import { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

export interface Plan {
  id: number;
  name: string;
  description?: string | null;
  price_month: number;
  price_yearly: number;
  price_setup: number;
  max_users?: number | null;
  has_schema: boolean;
  recommended: boolean;
  order: number;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PlansDataGridProps {
  plans: Plan[];
  isLoading: boolean;
  onSelectionChange?: (count: number) => void;
  onEdit?: (plan: Plan) => void;
  onDelete?: (id: number) => void;
  onReorder?: (id: number, newOrder: number) => void;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PlansDataGrid({
  plans,
  isLoading,
  onSelectionChange,
  onEdit,
  onDelete,
  onReorder,
}: PlansDataGridProps) {
  const [data, setData] = useState<Plan[]>(plans);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(["drag", "select", "id", "name", "max_users", "price_setup", "price_month", "price_yearly", "has_schema", "recommended", "active", "actions"]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => { setData(plans); }, [plans]);
  useEffect(() => { onSelectionChange?.(Object.keys(rowSelection).length); }, [rowSelection, onSelectionChange]);

  const dataIds = useMemo<UniqueIdentifier[]>(() => data.map((row) => String(row.id)), [data]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        onReorder?.(Number(active.id), newIndex + 1);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: () => <DataGridTableDndRowHandle className="size-5 [&_svg]:size-3" />,
        meta: { skeleton: <></>, headerClassName: "w-[3%]", cellClassName: "w-[3%]" },
        size: 0,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        meta: { skeleton: <Skeleton className="h-4 w-4" />, headerClassName: "w-[3%]", cellClassName: "w-[3%]" },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        id: "id",
        header: ({ column }) => <DataGridColumnHeader title="ID" column={column} />,
        cell: (info) => (
          <span className="text-muted-foreground font-mono">
            #{String(info.getValue() as number).padStart(5, "0")}
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-14" />, headerClassName: "w-[5%]", cellClassName: "w-[5%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => <DataGridColumnHeader title="Nome" column={column} />,
        cell: ({ row }) => (
          <button
            onClick={() => onEdit?.(row.original)}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-left"
          >
            {row.original.name}
          </button>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-40" /> },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "max_users",
        id: "max_users",
        header: ({ column }) => <DataGridColumnHeader title="Usuários" column={column} />,
        cell: ({ row }) => (
          row.original.max_users != null
            ? <span className="text-sm font-bold text-center block">{row.original.max_users}</span>
            : <span className="text-muted-foreground text-sm text-center block">—</span>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-12" />, headerClassName: "w-[5%]", cellClassName: "w-[5%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "price_setup",
        id: "price_setup",
        header: ({ column }) => <DataGridColumnHeader title="Setup" column={column} />,
        cell: ({ row }) => (
          row.original.price_setup > 0
            ? <span className="text-sm font-bold text-right block">{fmt(row.original.price_setup)}</span>
            : <span className="text-muted-foreground text-sm text-right block">—</span>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-24" />, headerClassName: "w-[8%]", cellClassName: "w-[8%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "price_month",
        id: "price_month",
        header: ({ column }) => <DataGridColumnHeader title="Mensal" column={column} />,
        cell: ({ row }) => <span className="text-sm font-bold text-right block">{fmt(row.original.price_month)}</span>,
        meta: { skeleton: <Skeleton className="h-5 w-24" />, headerClassName: "w-[8%]", cellClassName: "w-[8%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "price_yearly",
        id: "price_yearly",
        header: ({ column }) => <DataGridColumnHeader title="Anual" column={column} />,
        cell: ({ row }) => <span className="text-sm font-bold text-right block">{fmt(row.original.price_yearly)}</span>,
        meta: { skeleton: <Skeleton className="h-5 w-24" />, headerClassName: "w-[8%]", cellClassName: "w-[8%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "has_schema",
        id: "has_schema",
        header: ({ column }) => <DataGridColumnHeader title="CRM" column={column} />,
        cell: ({ row }) =>
          row.original.has_schema ? (
            <Badge variant="success" appearance="light">Sim</Badge>
          ) : (
            <Badge variant="secondary" appearance="light">Não</Badge>
          ),
        meta: { skeleton: <Skeleton className="h-6 w-12" />, headerClassName: "w-[5%]", cellClassName: "w-[5%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "recommended",
        id: "recommended",
        header: ({ column }) => <DataGridColumnHeader title="Recomendado" column={column} />,
        cell: ({ row }) =>
          row.original.recommended ? (
            <Badge variant="warning" appearance="light">Sim</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
        meta: { skeleton: <Skeleton className="h-6 w-12" />, headerClassName: "w-[5%]", cellClassName: "w-[5%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "active",
        id: "active",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="success" appearance="light">Ativo</Badge>
          ) : (
            <Badge variant="destructive" appearance="light">Inativo</Badge>
          ),
        meta: { skeleton: <Skeleton className="h-6 w-16" />, headerClassName: "w-[5%]", cellClassName: "w-[5%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: "actions",
        header: () => <span className="text-muted-foreground text-sm w-full block text-right">Ações</span>,
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
        meta: { skeleton: <Skeleton className="h-7 w-16" />, headerClassName: "w-[10%] text-right", cellClassName: "w-[10%]" },
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
    getRowId: (row: Plan) => String(row.id),
    state: { pagination, sorting, columnOrder, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
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
      tableLayout={{ width: "auto", rowsDraggable: true, columnsPinnable: false, columnsMovable: false, columnsVisibility: false }}
    >
      <div className="w-full space-y-2.5">
        <div className="w-full border rounded-lg">
          <ScrollArea>
            <DataGridTableDndRows handleDragEnd={handleDragEnd} dataIds={dataIds} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <DataGridPagination rowsPerPageLabel="Registros por página" info=" " />
      </div>
    </DataGrid>
  );
}
