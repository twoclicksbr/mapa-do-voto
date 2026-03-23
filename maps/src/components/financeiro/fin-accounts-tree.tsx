import React, { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type AccountType   = "asset" | "liability" | "revenue" | "expense" | "cost";
export type AccountNature = "analytic" | "synthetic";

export interface FinAccount {
  id: number;
  parent_id: number | null;
  code: string | null;
  name: string;
  description: string | null;
  type: AccountType;
  nature: AccountNature;
  order: number;
  active: boolean;
  children: FinAccount[];
}

export interface ReorderItem {
  id: number;
  order: number;
  parent_id: number | null;
}

// ─── Labels & colors ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AccountType, string> = {
  asset:     "Ativo",
  liability: "Passivo",
  revenue:   "Receita",
  expense:   "Despesa",
  cost:      "Custo",
};

type BadgeVariant = "primary" | "destructive" | "success" | "warning" | "secondary";

const TYPE_VARIANTS: Record<AccountType, BadgeVariant> = {
  asset:     "primary",
  liability: "destructive",
  revenue:   "success",
  expense:   "warning",
  cost:      "secondary",
};

// ─── Tree utilities ──────────────────────────────────────────────────────────

/** Deriva código automaticamente da posição (ex: 1, 1.1, 1.1.2). */
function assignCodes(nodes: FinAccount[], prefix = ""): FinAccount[] {
  return nodes.map((node, index) => {
    const code = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
    return { ...node, code, children: assignCodes(node.children, code) };
  });
}

function flattenTree(nodes: FinAccount[]): FinAccount[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}

function getSiblings(nodes: FinAccount[], parentId: number | null): FinAccount[] | null {
  if (parentId === null) return nodes;
  for (const node of nodes) {
    if (node.id === parentId) return node.children;
    const found = getSiblings(node.children, parentId);
    if (found !== null) return found;
  }
  return null;
}

function replaceChildren(
  nodes: FinAccount[],
  parentId: number | null,
  newChildren: FinAccount[]
): FinAccount[] {
  if (parentId === null) return newChildren;
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children: newChildren };
    return { ...node, children: replaceChildren(node.children, parentId, newChildren) };
  });
}

// ─── Sortable row ────────────────────────────────────────────────────────────

interface SortableRowProps {
  node: FinAccount;
  depth: number;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onAddChild: (node: FinAccount) => void;
  onEdit: (node: FinAccount) => void;
  onDelete: (id: number) => void;
}

function SortableRow({
  node,
  depth,
  isExpanded,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-4 py-2 border-b border-border hover:bg-accent/30 transition-colors",
        isDragging && "opacity-50 bg-accent z-50"
      )}
    >
      {/* indent */}
      <div style={{ width: depth * 20 }} className="shrink-0" />

      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
      >
        <GripVertical className="size-4" />
      </button>

      {/* expand/collapse */}
      <button
        onClick={() => onToggle(node.id)}
        className={cn(
          "shrink-0 size-5 flex items-center justify-center rounded hover:bg-accent transition-colors",
          node.children.length === 0 && "invisible"
        )}
      >
        {isExpanded
          ? <ChevronDown className="size-3.5" />
          : <ChevronRight className="size-3.5" />}
      </button>

      {/* code */}
      {node.code ? (
        <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
          {node.code}
        </span>
      ) : (
        <span className="w-8 shrink-0" />
      )}

      {/* name + description */}
      <div className="flex flex-col flex-1 min-w-0">
        <button
          onClick={() => onEdit(node)}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 text-sm text-left truncate transition-colors"
        >
          {node.name}
        </button>
        {node.description && (
          <span className="text-xs text-muted-foreground truncate">{node.description}</span>
        )}
      </div>

      {/* type */}
      <Badge variant={TYPE_VARIANTS[node.type]} appearance="light" size="sm" className="shrink-0">
        {TYPE_LABELS[node.type]}
      </Badge>

      {/* status */}
      {node.active
        ? <Badge variant="success" appearance="light" size="sm" className="shrink-0">Ativo</Badge>
        : <Badge variant="destructive" appearance="light" size="sm" className="shrink-0">Inativo</Badge>
      }

      {/* actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-7 bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
              onClick={() => onAddChild(node)}
            >
              <Plus className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Adicionar sub-conta</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-7 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
              onClick={() => onEdit(node)}
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
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Excluir</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Account group (recursive level) ────────────────────────────────────────

interface AccountGroupProps {
  nodes: FinAccount[];
  depth: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onAddChild: (node: FinAccount) => void;
  onEdit: (node: FinAccount) => void;
  onDelete: (id: number) => void;
}

function AccountGroup({
  nodes,
  depth,
  expandedIds,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: AccountGroupProps) {
  return (
    <SortableContext
      items={nodes.map((n) => n.id)}
      strategy={verticalListSortingStrategy}
    >
      {nodes.map((node) => (
        <React.Fragment key={node.id}>
          <SortableRow
            node={node}
            depth={depth}
            isExpanded={expandedIds.has(node.id)}
            onToggle={onToggle}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {expandedIds.has(node.id) && node.children.length > 0 && (
            <AccountGroup
              nodes={node.children}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </React.Fragment>
      ))}
    </SortableContext>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface FinAccountsTreeProps {
  accounts: FinAccount[];
  isLoading: boolean;
  onReorder?: (items: ReorderItem[]) => void;
  onAddChild?: (parent: FinAccount) => void;
  onEdit?: (account: FinAccount) => void;
  onDelete?: (id: number) => void;
}

export function FinAccountsTree({
  accounts,
  isLoading,
  onReorder,
  onAddChild,
  onEdit,
  onDelete,
}: FinAccountsTreeProps) {
  const [data, setData] = useState<FinAccount[]>(accounts);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    // Expand root nodes by default
    return new Set(accounts.map((a) => a.id));
  });

  // Sync external data changes (e.g. after save)
  React.useEffect(() => {
    setData(accounts);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      // Auto-expand newly added roots
      accounts.forEach((a) => { if (!prev.has(a.id)) next.add(a.id); });
      return next;
    });
  }, [accounts]);

  // Códigos derivados automaticamente da posição na árvore
  const dataWithCodes = useMemo(() => assignCodes(data), [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleToggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const allNodes = flattenTree(data);
      const activeNode = allNodes.find((n) => n.id === Number(active.id));
      const overNode   = allNodes.find((n) => n.id === Number(over.id));
      if (!activeNode || !overNode) return;
      if (activeNode.parent_id !== overNode.parent_id) return; // different level — ignore

      const siblings = getSiblings(data, activeNode.parent_id);
      if (!siblings) return;

      const oldIndex = siblings.findIndex((n) => n.id === activeNode.id);
      const newIndex = siblings.findIndex((n) => n.id === overNode.id);
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(siblings, oldIndex, newIndex);
      const newData   = replaceChildren(data, activeNode.parent_id, reordered);
      setData(newData);

      onReorder?.(
        reordered.map((n, i) => ({ id: n.id, order: i + 1, parent_id: n.parent_id }))
      );
    },
    [data, onReorder]
  );

  if (isLoading) {
    return (
      <div className="space-y-1 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" style={{ marginLeft: (i % 3) * 20 }} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <span className="text-sm">Nenhuma conta cadastrada.</span>
        <span className="text-xs">Clique em "Novo Registro" para começar.</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="divide-y-0">
        <AccountGroup
          nodes={dataWithCodes}
          depth={0}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          onAddChild={onAddChild ?? (() => {})}
          onEdit={onEdit ?? (() => {})}
          onDelete={onDelete ?? (() => {})}
        />
      </div>
    </DndContext>
  );
}
