import { useState, useEffect, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, ClipboardList, Home, LayoutGrid, Table2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import api from "@/lib/api";
import { PageFooter } from "@/components/common/page-footer";
import { formatRecordCount } from "@/lib/helpers";
import { AttendanceDataGrid, type Attendance } from "./attendance-data-grid";
import { AttendanceKanban } from "./attendance-kanban";
import { AttendanceModal } from "./attendance-modal";
import { AttendanceFilterModal, type AttendanceFilters } from "./attendance-filter-modal";
// ─── Filtering ────────────────────────────────────────────────────────────────

function dateRangeFromValue(v: import("@/components/reui/date-selector").DateSelectorValue): { dateFrom?: string; dateTo?: string } {
  if (!v) return {};
  // day / between
  if (v.period === "day" && v.startDate && v.endDate) return { dateFrom: v.startDate.substring(0, 10), dateTo: v.endDate.substring(0, 10) };
  if (v.period === "day" && v.startDate)               return { dateFrom: v.startDate.substring(0, 10), dateTo: v.startDate.substring(0, 10) };
  // year
  if (v.period === "year" && v.year != null) return { dateFrom: `${v.year}-01-01`, dateTo: `${v.year}-12-31` };
  return {};
}

function applyAttendanceFilters(list: Attendance[], filters: AttendanceFilters): Attendance[] {
  return list.filter((a) => {
    if (filters.filterTitle && !a.title.toLowerCase().includes(filters.filterTitle.toLowerCase())) return false;
    if (filters.peopleId && a.people_id !== filters.peopleId) return false;
    if (filters.statuses?.length && !filters.statuses.includes(a.status)) return false;
    if (filters.priorities?.length && !filters.priorities.includes(a.priority)) return false;
    if (filters.dateValue && filters.dateField) {
      const { dateFrom, dateTo } = dateRangeFromValue(filters.dateValue);
      const raw = a[filters.dateField as keyof Attendance] as string | null | undefined;
      if (!raw) return false;
      const d = raw.substring(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AttendanceTab() {
  const [attendances, setAttendances]     = useState<Attendance[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editItem, setEditItem]           = useState<Attendance | null>(null);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [filters, setFilters]             = useState<AttendanceFilters>({});
  const [viewMode, setViewMode]           = useState<"grid" | "kanban">("grid");

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Attendance[]>("/attendances");
      setAttendances(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => applyAttendanceFilters(attendances, filters), [attendances, filters]);

  const hasFilters = !!(filters.filterTitle || filters.peopleId || filters.statuses?.length || filters.priorities?.length || filters.dateValue);

  const handleEdit = (a: Attendance) => {
    setEditItem(a);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Excluir este atendimento?")) return;
    await api.delete(`/attendances/${id}`);
    setAttendances((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReorder = async (id: number, newOrder: number) => {
    setAttendances((prev) => {
      const reordered = [...prev];
      const fromIdx = reordered.findIndex((a) => a.id === id);
      const toIdx = newOrder - 1;
      if (fromIdx < 0) return prev;
      const [item] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, item);
      const items = reordered.map((a, i) => ({ id: a.id, order: i + 1 }));
      api.put("/attendances/reorder", { items }).catch(() => {});
      return reordered;
    });
  };

  const handleSaved = (saved: Attendance, justCreated?: boolean) => {
    setAttendances((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    if (justCreated) {
      setEditItem(saved);
      setModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2.5">
              <ClipboardList className="size-5" />
              Atendimentos
              <Badge variant="success" appearance="light" size="md">{formatRecordCount(filtered.length)}</Badge>
              {hasFilters && (
                <button
                  className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  onClick={() => setFilters({})}
                >
                  <X className="size-3" /> Limpar filtros
                </button>
              )}
            </h2>
            <Breadcrumb>
              <BreadcrumbList className="flex items-center">
                {['Home', 'Atendimentos'].map((item, i, arr) => (
                  <Fragment key={item}>
                    <BreadcrumbItem className="inline-flex items-center">
                      {i < arr.length - 1 ? (
                        <span className="inline-flex items-center gap-1 leading-none">
                          {item === 'Home' && <Home className="size-3.5 shrink-0" />}{item}
                        </span>
                      ) : (
                        <BreadcrumbPage className="inline-flex items-center gap-1 leading-none">
                          <ClipboardList className="size-3.5 shrink-0" />{item}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {i < arr.length - 1 && <BreadcrumbSeparator />}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)}>
              <Search className="size-4 mr-2" />
              Pesquisar
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setEditItem(null); setModalOpen(true); }}>
              <Plus className="size-4 mr-2" />
              Novo Registro
            </Button>
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                className={`p-1.5 transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                onClick={() => setViewMode("kanban")}
                title="Kanban"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
                onClick={() => setViewMode("grid")}
                title="Grid"
              >
                <Table2 className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
          {viewMode === "kanban" ? (
            <AttendanceKanban
              attendances={filtered}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={(id, newStatus) => {
                setAttendances((prev) =>
                  prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
                )
              }}
              onReorderAll={(flat) => setAttendances(flat)}
            />
          ) : (
            <AttendanceDataGrid
              attendances={filtered}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </div>
      </div>

      <PageFooter />

      {/* Modals */}
      <AttendanceModal
        open={modalOpen}
        attendance={editItem}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
      <AttendanceFilterModal
        open={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </div>
  );
}
