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
import { Pencil, Trash2, PartyPopper, User, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/helpers";

export interface Person {
  id: number;
  name: string;
  birth_date?: string | null;
  photo_path?: string | null;
  photo_original?: string | null;
  photo_md?: string | null;
  photo_sm?: string | null;
  type_people_id: number | null;
  type_people?: { id: number; name: string } | null;
  active: boolean;
}

interface PeopleDataGridProps {
  people: Person[];
  isLoading: boolean;
  onSelectionChange?: (count: number) => void;
  onEdit?: (person: Person) => void;
  onDelete?: (id: number) => void;
}

export function PeopleDataGrid({ people, isLoading, onSelectionChange, onEdit, onDelete }: PeopleDataGridProps) {
  const [data, setData] = useState<Person[]>(people);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnOrder, setColumnOrder] = useState<string[]>(["drag", "select", "id", "name", "birth_date", "type_people", "active", "actions"]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => { setData(people); }, [people]);

  useEffect(() => {
    onSelectionChange?.(Object.keys(rowSelection).length);
  }, [rowSelection, onSelectionChange]);

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => data.map((row) => String(row.id)),
    [data]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: () => <DataGridTableDndRowHandle className="size-5 [&_svg]:size-3" />,
        meta: {
          skeleton: <></>,
          headerClassName: "w-0 p-0 opacity-0 pointer-events-none hidden",
          cellClassName: "w-0 p-0 opacity-0 pointer-events-none hidden",
        },
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
          <div className="flex items-center gap-2.5">
            <div
              className={`size-7 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden ${row.original.photo_original ? "cursor-zoom-in" : ""}`}
              onClick={(e) => {
                if (row.original.photo_original) {
                  e.stopPropagation();
                  setLightbox({ src: row.original.photo_original, name: row.original.name });
                }
              }}
            >
              {row.original.photo_sm ? (
                <img src={row.original.photo_sm} alt={row.original.name} className="size-full object-cover" />
              ) : (
                <User className="size-3.5 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => onEdit?.(row.original)}
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-left"
            >
              {row.original.name}
            </button>
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-40" /> },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "birth_date",
        id: "birth_date",
        header: ({ column }) => <DataGridColumnHeader title="Aniversário" column={column} />,
        cell: ({ row }) => {
          const bd = row.original.birth_date;
          if (!bd) return <span className="text-sm text-muted-foreground">—</span>;
          const today = new Date();
          const date = new Date(bd + "T00:00:00");
          const isBirthday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
          return (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {isBirthday && <PartyPopper className="size-3.5 text-pink-500 shrink-0 animate-pulse" />}
              {formatDate(bd)}
            </span>
          );
        },
        meta: { skeleton: <Skeleton className="h-5 w-24" />, headerClassName: "w-[12%]", cellClassName: "w-[12%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "type_people",
        id: "type_people",
        header: ({ column }) => <DataGridColumnHeader title="Tipo" column={column} />,
        cell: ({ row }) => {
          const tp = row.original.type_people;
          return tp ? (
            <Badge variant="secondary" appearance="light">{tp.name}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
        meta: { skeleton: <Skeleton className="h-6 w-20" />, headerClassName: "w-[15%]", cellClassName: "w-[15%]" },
        enableSorting: false,
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
        meta: { skeleton: <Skeleton className="h-6 w-16" />, headerClassName: "w-[8%]", cellClassName: "w-[8%]" },
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
        meta: { skeleton: <Skeleton className="h-7 w-16" />, headerClassName: "w-[10%]", cellClassName: "w-[10%]" },
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
    getRowId: (row: Person) => String(row.id),
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
    <>
    {lightbox && (
      <div
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
        onClick={() => setLightbox(null)}
      >
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <img
            src={lightbox.src}
            alt={lightbox.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute -top-3 -right-3 size-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    )}
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
    </>
  );
}
