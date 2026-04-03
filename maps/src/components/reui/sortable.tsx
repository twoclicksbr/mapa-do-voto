import React, { createContext, useContext } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

// Context to pass drag listeners from SortableItem → SortableItemHandle
const ItemCtx = createContext<{ listeners: Record<string, unknown>; setActivatorNodeRef: (el: HTMLElement | null) => void } | null>(null)

interface SortableProps<T> {
  value: T[]
  onValueChange: (items: T[]) => void
  getItemValue: (item: T) => string
  strategy?: "vertical" | "horizontal"
  className?: string
  children: React.ReactNode
}

function Sortable<T>({ value, onValueChange, getItemValue, strategy = "vertical", className, children }: SortableProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = value.map((item) => getItemValue(item))
  const sortingStrategy = strategy === "horizontal" ? horizontalListSortingStrategy : verticalListSortingStrategy

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    onValueChange(arrayMove(value, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={sortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
      <DragOverlay />
    </DndContext>
  )
}

interface SortableItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

function SortableItem({ value, children, className }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: value })
  return (
    <ItemCtx.Provider value={{ listeners: listeners as Record<string, unknown>, setActivatorNodeRef }}>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(isDragging ? "opacity-50" : "", className)}
        {...attributes}
      >
        {children}
      </div>
    </ItemCtx.Provider>
  )
}

interface SortableItemHandleProps {
  children: React.ReactNode
  className?: string
}

function SortableItemHandle({ children, className }: SortableItemHandleProps) {
  const ctx = useContext(ItemCtx)
  return (
    <span
      ref={ctx?.setActivatorNodeRef}
      {...(ctx?.listeners as React.HTMLAttributes<HTMLSpanElement>)}
      className={cn("cursor-grab active:cursor-grabbing touch-none", className)}
    >
      {children}
    </span>
  )
}

export { Sortable, SortableItem, SortableItemHandle }
