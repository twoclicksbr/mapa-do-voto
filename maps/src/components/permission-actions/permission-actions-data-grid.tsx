import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Pencil, Trash2, SquarePlus, SquareMinus } from "lucide-react";
import api from "@/lib/api";

export interface PermissionAction {
  id: number;
  module: string;
  name_module: string | null;
  action: string;
  name_action: string | null;
  description: string | null;
  order: number;
}

interface ModuleGroup {
  module: string;
  actions: PermissionAction[];
}

interface PermissionActionsDataGridProps {
  permissionActions: PermissionAction[];
  isLoading: boolean;
  onEdit?: (pa: PermissionAction) => void;
  onDelete?: (id: number) => void;
  onAddToModule?: (module: string) => void;
}

// ─── Sortable action row ────────────────────────────────────────────────────

function SortableActionRow({
  action,
  onEdit,
  onDelete,
}: {
  action: PermissionAction;
  onEdit?: (pa: PermissionAction) => void;
  onDelete?: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: action.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
    >
      <div className="flex items-center w-full px-3 py-2 gap-2">
        {/* drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-none text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* ID */}
        <span className="flex-none w-[70px] text-muted-foreground font-mono text-xs">
          #{String(action.id).padStart(5, "0")}
        </span>

        {/* Action */}
        <button
          onClick={() => onEdit?.(action)}
          className="flex-1 text-left font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-sm truncate"
        >
          {action.name_action ?? action.action}
          {action.name_action && (
            <span className="ml-1.5 text-xs text-muted-foreground font-normal font-mono">({action.action})</span>
          )}
        </button>

        {/* Description */}
        <span className="flex-1 text-sm text-muted-foreground truncate hidden sm:block">
          {action.description ?? "—"}
        </span>

        {/* Actions */}
        <div className="flex-none flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
                onClick={() => onEdit?.(action)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-7 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                onClick={() => onDelete?.(action.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// ─── Action sub-list (DnD context for actions within a module) ─────────────

function ActionSubList({
  group,
  onEdit,
  onDelete,
  onActionReorder,
}: {
  group: ModuleGroup;
  onEdit?: (pa: PermissionAction) => void;
  onDelete?: (id: number) => void;
  onActionReorder: (module: string, reordered: PermissionAction[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const actionIds = group.actions.map((a) => a.id);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = group.actions.findIndex((a) => a.id === active.id);
      const newIndex = group.actions.findIndex((a) => a.id === over.id);
      const reordered = arrayMove(group.actions, oldIndex, newIndex);
      onActionReorder(group.module, reordered);
    },
    [group, onActionReorder]
  );

  return (
    <div className="bg-muted/30 border-t border-border">
      {/* Sub-header */}
      <div className="flex items-center px-3 py-1.5 border-b border-border bg-muted/50">
        <span className="w-[32px] flex-none" />
        <span className="w-[82px] flex-none text-xs text-muted-foreground font-medium">ID</span>
        <span className="flex-1 text-xs text-muted-foreground font-medium">Ação</span>
        <span className="flex-1 text-xs text-muted-foreground font-medium hidden sm:block">Descrição</span>
        <span className="w-[90px] flex-none text-xs text-muted-foreground font-medium text-right">Ações</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={actionIds} strategy={verticalListSortingStrategy}>
          {group.actions.map((action) => (
            <SortableActionRow key={action.id} action={action} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ─── Sortable module row ────────────────────────────────────────────────────

function SortableModuleRow({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddToModule,
  onActionReorder,
}: {
  group: ModuleGroup;
  isExpanded: boolean;
  onToggle: (module: string) => void;
  onEdit?: (pa: PermissionAction) => void;
  onDelete?: (id: number) => void;
  onAddToModule?: (module: string) => void;
  onActionReorder: (module: string, reordered: PermissionAction[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.module });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="border-b border-border last:border-b-0"
    >
      {/* Module header row */}
      <div className="flex items-center px-3 py-2.5 hover:bg-muted/30 transition-colors gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-none text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
          tabIndex={-1}
        >
          <GripVertical className="size-4" />
        </button>

        {/* Expand toggle */}
        <Button
          onClick={() => onToggle(group.module)}
          size="icon"
          variant="ghost"
          className="flex-none size-7 opacity-70 hover:bg-transparent hover:opacity-100"
        >
          {isExpanded ? <SquareMinus className="size-3.5" /> : <SquarePlus className="size-3.5" />}
        </Button>

        {/* Module name */}
        <span className="flex-1 font-semibold text-sm">
          {group.actions[0]?.name_module ?? group.module}
          {group.actions[0]?.name_module && (
            <span className="ml-1.5 text-xs text-muted-foreground font-normal font-mono">({group.module})</span>
          )}
        </span>

        {/* Count badge */}
        <Badge variant="primary" appearance="light" size="sm">
          {group.actions.length} {group.actions.length === 1 ? "ação" : "ações"}
        </Badge>

        {/* Add action button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onAddToModule?.(group.module)}
            >
              <SquarePlus className="size-3.5 mr-1" />
              Nova ação
            </Button>
          </TooltipTrigger>
          <TooltipContent>Adicionar ação ao módulo {group.module}</TooltipContent>
        </Tooltip>
      </div>

      {/* Expanded action list */}
      {isExpanded && (
        <ActionSubList
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onActionReorder={onActionReorder}
        />
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

function groupToModuleGroups(items: PermissionAction[]): ModuleGroup[] {
  const seen: string[] = [];
  const map: Record<string, PermissionAction[]> = {};
  for (const item of items) {
    if (!map[item.module]) {
      seen.push(item.module);
      map[item.module] = [];
    }
    map[item.module].push(item);
  }
  return seen.map((module) => ({ module, actions: map[module] }));
}

async function saveReorder(items: PermissionAction[]) {
  try {
    await api.put("/permission-actions/reorder", items.map((item, idx) => ({ id: item.id, order: idx + 1 })));
  } catch (err) {
    console.error("[reorder] falhou:", err);
  }
}

export function PermissionActionsDataGrid({
  permissionActions,
  isLoading,
  onEdit,
  onDelete,
  onAddToModule,
}: PermissionActionsDataGridProps) {
  const [items, setItems] = useState<PermissionAction[]>(() =>
    [...permissionActions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Sync from props: preserve local order when only content changes; reset when IDs change
  useEffect(() => {
    setItems((prev) => {
      const prevIds = new Set(prev.map((a) => a.id));
      const newIds = new Set(permissionActions.map((a) => a.id));
      const sameIds =
        prevIds.size === newIds.size && [...prevIds].every((id) => newIds.has(id));

      if (sameIds) {
        return prev.map((p) => {
          const updated = permissionActions.find((a) => a.id === p.id);
          return updated ? { ...updated, order: p.order } : p;
        });
      }

      return [...permissionActions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
  }, [permissionActions]);

  const moduleGroups = useMemo(() => groupToModuleGroups(items), [items]);
  const moduleIds = moduleGroups.map((g) => g.module);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const toggleModule = useCallback((module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  }, []);

  // Module-level drag end
  const handleModuleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = moduleIds.indexOf(active.id as string);
      const newIndex = moduleIds.indexOf(over.id as string);
      const newGroups = arrayMove(moduleGroups, oldIndex, newIndex);

      // Flatten groups back to flat list preserving action order within modules
      const newItems = newGroups.flatMap((g) => g.actions);
      setItems(newItems);
      saveReorder(newItems);
    },
    [moduleIds, moduleGroups]
  );

  // Action-level drag end (within a module)
  const handleActionReorder = useCallback(
    (module: string, reordered: PermissionAction[]) => {
      setItems((prev) => {
        // Replace actions of this module with reordered list, keeping position in flat array
        const firstIdx = prev.findIndex((a) => a.module === module);
        const newItems = [...prev];
        newItems.splice(firstIdx, reordered.length, ...reordered);
        saveReorder(newItems);
        return newItems;
      });
    },
    []
  );

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 border-b border-border">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-border last:border-b-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (moduleGroups.length === 0) {
    return (
      <div className="border border-border rounded-lg flex items-center justify-center py-12 text-sm text-muted-foreground">
        Nenhuma permissão cadastrada
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border text-xs text-muted-foreground font-medium">
        <span className="w-[28px] flex-none" />
        <span className="w-[28px] flex-none" />
        <span className="flex-1">Módulo</span>
        <span className="w-[80px] flex-none">Ações</span>
        <span className="w-[108px] flex-none" />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
        <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
          {moduleGroups.map((group) => (
            <SortableModuleRow
              key={group.module}
              group={group}
              isExpanded={expandedModules.has(group.module)}
              onToggle={toggleModule}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddToModule={onAddToModule}
              onActionReorder={handleActionReorder}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
