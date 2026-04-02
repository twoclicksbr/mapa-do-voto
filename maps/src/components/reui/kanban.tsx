import React, { createContext, useContext, useRef, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

// ─── Contexts ─────────────────────────────────────────────────────────────────

interface KanbanCtxType {
  getItemValue: (item: unknown) => string
  activeId: UniqueIdentifier | null
  columns: Record<string, unknown[]>
}

const KanbanCtx = createContext<KanbanCtxType>({
  getItemValue: () => "",
  activeId: null,
  columns: {},
})

const KanbanItemCtx = createContext<{
  listeners?: Record<string, React.EventHandler<React.SyntheticEvent>>
  isDragging?: boolean
}>({})

// ─── Kanban root ──────────────────────────────────────────────────────────────

interface KanbanProps<T> {
  value: Record<string, T[]>
  onValueChange: (value: Record<string, T[]>) => void
  getItemValue: (item: T) => string
  children: React.ReactNode
  className?: string
}

function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  className,
}: KanbanProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)

  // Always-fresh ref — avoids stale closures in drag handlers
  const valueRef = useRef(value)
  valueRef.current = value

  // Track which column the drag started in
  const startColRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  /** Returns the column key that contains this id (item or column itself). */
  const findColumn = (id: UniqueIdentifier, cols: Record<string, T[]>): string | null => {
    const key = String(id)
    // id is a column key (used by useDroppable on empty columns)
    if (key in cols) return key
    // id is an item inside a column
    for (const [colId, items] of Object.entries(cols)) {
      if (items.some((item) => getItemValue(item) === key)) return colId
    }
    return null
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id)
    startColRef.current = findColumn(active.id, valueRef.current)
  }

  /** Handles cross-column moves visually while dragging. */
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const cols = valueRef.current
    const fromCol = findColumn(active.id, cols)
    const toCol = findColumn(over.id, cols)
    if (!fromCol || !toCol || fromCol === toCol) return

    const fromItems = [...cols[fromCol]] as T[]
    const toItems = [...cols[toCol]] as T[]
    const fromIdx = fromItems.findIndex((item) => getItemValue(item) === String(active.id))
    if (fromIdx === -1) return
    const [moved] = fromItems.splice(fromIdx, 1)
    const overIdx = toItems.findIndex((item) => getItemValue(item) === String(over.id))
    // If over.id is the column key itself, insert at the end
    toItems.splice(overIdx >= 0 ? overIdx : toItems.length, 0, moved)

    onValueChange({ ...cols, [fromCol]: fromItems, [toCol]: toItems })
  }

  /** Finalises the drag:
   *  - Same column → reorder (arrayMove)
   *  - Cross column → already handled in handleDragOver, skip to avoid double-firing */
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)

    if (!over) return

    const cols = valueRef.current
    const currentCol = findColumn(active.id, cols)

    // Cross-column move was already applied in handleDragOver — nothing more to do
    if (currentCol !== startColRef.current) return

    // Same-column reorder
    if (active.id === over.id) return
    const items = [...cols[currentCol!]] as T[]
    const oldIdx = items.findIndex((item) => getItemValue(item) === String(active.id))
    const newIdx = items.findIndex((item) => getItemValue(item) === String(over.id))
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return
    onValueChange({ ...cols, [currentCol!]: arrayMove(items, oldIdx, newIdx) })
  }

  return (
    <KanbanCtx.Provider
      value={{ getItemValue: getItemValue as (item: unknown) => string, activeId, columns: value }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={cn("", className)}>{children}</div>
      </DndContext>
    </KanbanCtx.Provider>
  )
}

// ─── Board ────────────────────────────────────────────────────────────────────

function KanbanBoard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex gap-4", className)} {...props} />
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface KanbanColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function KanbanColumn({ value: _colId, className, ...props }: KanbanColumnProps) {
  return <div className={cn("", className)} {...props} />
}

// ─── Column content — droppable (even when empty) + sortable context ──────────

interface KanbanColumnContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function KanbanColumnContent({
  value: colId,
  className,
  children,
  ...props
}: KanbanColumnContentProps) {
  const { columns, getItemValue } = useContext(KanbanCtx)
  const items = (columns[colId] ?? []) as unknown[]
  const ids = items.map((item) => getItemValue(item))

  // Register the column as a droppable zone so empty columns receive drops
  const { setNodeRef } = useDroppable({ id: colId })

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn("", className)} {...props}>
        {children}
      </div>
    </SortableContext>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

interface KanbanItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function KanbanItem({ value: itemId, className, children, ...props }: KanbanItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
  })

  return (
    <KanbanItemCtx.Provider
      value={{
        listeners: listeners as Record<string, React.EventHandler<React.SyntheticEvent>>,
        isDragging,
      }}
    >
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
        }}
        className={cn("", className)}
        {...attributes}
        {...props}
      >
        {children}
      </div>
    </KanbanItemCtx.Provider>
  )
}

// ─── Item handle ──────────────────────────────────────────────────────────────

function KanbanItemHandle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { listeners } = useContext(KanbanItemCtx)
  return (
    <div
      className={cn("cursor-grab active:cursor-grabbing", className)}
      {...(listeners as object)}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function KanbanOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { activeId } = useContext(KanbanCtx)
  return (
    <DragOverlay>
      {activeId ? <div className={cn("rounded-md", className)} {...props} /> : null}
    </DragOverlay>
  )
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
}
