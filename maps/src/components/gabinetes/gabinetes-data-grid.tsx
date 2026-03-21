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
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface Tenant {
  id: number;
  tenant_id: number | null;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
  _depth?: number;
}

function flattenTree(tenants: Tenant[]): Tenant[] {
  const roots = tenants.filter(t => t.tenant_id === null);
  const childrenOf = (id: number) => tenants.filter(t => t.tenant_id === id);
  const result: Tenant[] = [];
  for (const root of roots) {
    result.push({ ...root, _depth: 0 });
    for (const child of childrenOf(root.id)) {
      result.push({ ...child, _depth: 1 });
    }
  }
  // tenants sem pai conhecido (tenant_id != null mas pai não está na lista)
  const placed = new Set(result.map(t => t.id));
  for (const t of tenants) {
    if (!placed.has(t.id)) result.push({ ...t, _depth: 0 });
  }
  return result;
}

interface GabinetesDataGridProps {
  tenants: Tenant[];
  isLoading: boolean;
  onSelectionChange?: (count: number) => void;
  onEdit?: (tenant: Tenant) => void;
}

export function GabinetesDataGrid({ tenants, isLoading, onSelectionChange, onEdit }: GabinetesDataGridProps) {
  const [data, setData] = useState<Tenant[]>(tenants);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnOrder, setColumnOrder] = useState<string[]>(["drag", "select", "id", "name", "slug", "valid_until", "active", "actions"]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    setData(flattenTree(tenants));
  }, [tenants]);

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

  const columns = useMemo<ColumnDef<Tenant>[]>(
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
        header: ({ column }) => (
          <DataGridColumnHeader title="ID" column={column} />
        ),
        cell: (info) => (
          <span className="text-muted-foreground font-mono">
            #{String(info.getValue() as number).padStart(5, "0")}
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-14" />, headerClassName: "w-[5%]", cellClassName: "w-[5%]" },
        size: 2,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Nome" column={column} />
        ),
        cell: ({ row }) => (
          <div style={{ paddingLeft: `${(row.original._depth ?? 0) * 20}px` }} className="flex items-center gap-1.5">
            {(row.original._depth ?? 0) > 0 && <span className="text-muted-foreground">↳</span>}
            <button onClick={() => onEdit?.(row.original)} className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-left">
              {row.original.name}
            </button>
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-5 w-40" /> },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "slug",
        id: "slug",
        header: ({ column }) => (
          <DataGridColumnHeader title="Subdomínio" column={column} />
        ),
        cell: (info) => {
          const slug = info.getValue() as string;
          const url = `https://${slug}.mapadovoto.com`;
          return (
            <span className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
              {slug}.mapadovoto.com
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="size-3.5" />
              </a>
            </span>
          );
        },
        meta: { skeleton: <Skeleton className="h-5 w-48" />, headerClassName: "w-[20%]", cellClassName: "w-[20%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "valid_until",
        id: "valid_until",
        header: ({ column }) => (
          <DataGridColumnHeader title="Validade" column={column} />
        ),
        cell: (info) => {
          const raw = info.getValue() as string;
          const [year, month, day] = raw.split("-").map(Number);
          const date = new Date(year, month - 1, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const in7Days = new Date(today);
          in7Days.setDate(today.getDate() + 7);

          let variant: "success" | "warning" | "destructive";
          if (date >= in7Days) variant = "success";
          else if (date > today) variant = "warning";
          else variant = "destructive";

          const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const label = diffDays > 0
            ? `${date.toLocaleDateString("pt-BR")} (${diffDays} dias)`
            : `${date.toLocaleDateString("pt-BR")} (vencido)`;

          return (
            <Badge variant={variant} appearance="light">
              {label}
            </Badge>
          );
        },
        meta: { skeleton: <Skeleton className="h-5 w-24" />, headerClassName: "w-[15%]", cellClassName: "w-[15%]" },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "active",
        id: "active",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="success" appearance="light">Público</Badge>
          ) : (
            <Badge variant="destructive" appearance="light">Oculto</Badge>
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
                <Button variant="outline" size="icon" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700" onClick={() => onEdit?.(row.original)}>
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lixeira</TooltipContent>
            </Tooltip>
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-7 w-16" />, headerClassName: "w-[10%]", cellClassName: "w-[10%]" },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEdit]
  );

  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: Tenant) => String(row.id),
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
            <DataGridTableDndRows
              handleDragEnd={handleDragEnd}
              dataIds={dataIds}
            />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <DataGridPagination rowsPerPageLabel="Registros por página" info=" " />
      </div>
    </DataGrid>
  );
}
