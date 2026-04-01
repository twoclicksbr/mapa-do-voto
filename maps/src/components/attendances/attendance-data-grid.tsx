import { useMemo, useState, useEffect } from "react";
import { DataGrid } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import {
  DataGridTableDndRowHandle,
  DataGridTableDndRows,
} from "@/components/reui/data-grid/data-grid-table-dnd-rows";
import { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/helpers";

export interface Attendance {
  id: number;
  people_id: number;
  people_name: string | null;
  people_photo_sm: string | null;
  title: string;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  status: "aberto" | "em_andamento" | "resolvido";
  priority: "alta" | "media" | "baixa";
  order?: number;
  opened_at: string | null;
  resolved_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  people?: AttendancePerson[];
}

export interface AttendancePerson {
  id: number;
  people_id: number;
  name: string | null;
  photo_sm: string | null;
  active: boolean;
}

interface AttendanceDataGridProps {
  attendances: Attendance[];
  isLoading: boolean;
  onSelectionChange?: (count: number) => void;
  onEdit?: (a: Attendance) => void;
  onDelete?: (id: number) => void;
  onReorder?: (id: number, newOrder: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
};

const STATUS_VARIANTS: Record<string, "destructive" | "warning" | "success"> = {
  aberto: "destructive",
  em_andamento: "warning",
  resolvido: "success",
};

const PRIORITY_LABELS: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const PRIORITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary"> = {
  alta: "destructive",
  media: "warning",
  baixa: "secondary",
};

export function AttendanceDataGrid({
  attendances,
  isLoading,
  onSelectionChange,
  onEdit,
  onDelete,
  onReorder,
}: AttendanceDataGridProps) {
  const [data, setData] = useState<Attendance[]>(attendances);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "drag", "select", "id", "title", "guests", "opened_at", "priority", "status", "actions",
  ]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => { setData(attendances); }, [attendances]);
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

  const columns = useMemo<ColumnDef<Attendance>[]>(
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
        meta: { skeleton: <Skeleton className="h-5 w-14" />, headerClassName: "w-[7%]", cellClassName: "w-[7%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => <DataGridColumnHeader title="Título" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onEdit?.(row.original)}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-left"
            >
              {row.original.title}
            </button>
            {row.original.people_name && (
              <span className="text-xs text-muted-foreground">{row.original.people_name}</span>
            )}
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-48" /> },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "priority",
        id: "priority",
        header: ({ column }) => <DataGridColumnHeader title="Prioridade" column={column} />,
        cell: ({ row }) => {
          const p = row.original.priority;
          return (
            <Badge variant={PRIORITY_VARIANTS[p] ?? "secondary"} appearance="light">
              {PRIORITY_LABELS[p] ?? p}
            </Badge>
          );
        },
        meta: { skeleton: <Skeleton className="h-6 w-16" />, headerClassName: "w-[10%]", cellClassName: "w-[10%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge variant={STATUS_VARIANTS[s] ?? "secondary"} appearance="light">
              {STATUS_LABELS[s] ?? s}
            </Badge>
          );
        },
        meta: { skeleton: <Skeleton className="h-6 w-20" />, headerClassName: "w-[12%]", cellClassName: "w-[12%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "opened_at",
        id: "opened_at",
        header: ({ column }) => <DataGridColumnHeader title="Abertura" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.opened_at ? formatDate(row.original.opened_at) : "—"}
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-24" />, headerClassName: "w-[10%]", cellClassName: "w-[10%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: "guests",
        header: () => <span className="text-muted-foreground text-sm">Convidados</span>,
        cell: ({ row }) => {
          const guests = row.original.people ?? [];
          if (guests.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <div className="flex -space-x-2">
              {guests.slice(0, 4).map((g) => (
                <Tooltip key={g.id}>
                  <TooltipTrigger>
                    <Avatar className="size-7 rounded-full overflow-hidden ring-2 ring-background transition-all duration-300 ease-in-out hover:z-10 hover:-translate-y-1 hover:shadow-md">
                      {g.photo_sm ? (
                        <AvatarImage src={g.photo_sm} alt={g.name ?? ""} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {(g.name ?? "").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={10}>{g.name}</TooltipContent>
                </Tooltip>
              ))}
              {guests.length > 4 && (
                <div className="size-7 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{guests.length - 4}
                </div>
              )}
            </div>
          );
        },
        meta: { skeleton: <Skeleton className="h-7 w-20" />, headerClassName: "w-[12%]", cellClassName: "w-[12%]" },
        enableSorting: false,
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
        meta: { skeleton: <Skeleton className="h-7 w-16" />, headerClassName: "w-[8%]", cellClassName: "w-[8%]" },
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
    getRowId: (row: Attendance) => String(row.id),
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
      tableLayout={{ width: "auto", rowsDraggable: false, columnsPinnable: false, columnsMovable: false, columnsVisibility: false }}
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
