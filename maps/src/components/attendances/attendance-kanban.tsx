import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/reui/kanban"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/helpers"
import api from "@/lib/api"
import type { Attendance } from "./attendance-data-grid"

// ─── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: Record<string, { title: string; color: string; variant: "destructive" | "warning" | "success" }> = {
  aberto:       { title: "Aberto",       color: "bg-red-500",    variant: "destructive" },
  em_andamento: { title: "Em Andamento", color: "bg-yellow-500", variant: "warning" },
  resolvido:    { title: "Resolvido",    color: "bg-green-500",  variant: "success" },
}

const PRIORITY_LABELS: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" }
const PRIORITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary"> = {
  alta: "destructive", media: "warning", baixa: "secondary",
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function AttendanceCard({
  attendance,
  onEdit,
  onDelete,
}: {
  attendance: Attendance
  onEdit?: (a: Attendance) => void
  onDelete?: (id: number) => void
}) {
  const guests = attendance.people ?? []

  return (
    <Frame spacing="sm" className="p-0 dark:bg-card dark:border-border">
      <FramePanel className="p-3">
        <div className="flex flex-col gap-2.5">
          {/* Title + actions */}
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => onEdit?.(attendance)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors text-left leading-snug"
            >
              {attendance.title}
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit?.(attendance)}
                  >
                    <Pencil className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete?.(attendance.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Person name */}
          {attendance.people_name && (
            <span className="text-xs text-muted-foreground">{attendance.people_name}</span>
          )}

          {/* Footer: priority + date + guests */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Badge variant={PRIORITY_VARIANTS[attendance.priority] ?? "secondary"} appearance="light" size="sm">
                {PRIORITY_LABELS[attendance.priority] ?? attendance.priority}
              </Badge>
              {attendance.opened_at && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {formatDate(attendance.opened_at)}
                </span>
              )}
            </div>
            {guests.length > 0 && (
              <div className="flex -space-x-1.5">
                {guests.slice(0, 4).map((g) => (
                  <Tooltip key={g.id}>
                    <TooltipTrigger className="p-0 m-0 border-0 bg-transparent shadow-none focus:outline-none leading-none">
                      <Avatar className="size-5 rounded-full ring-2 ring-background">
                        {g.photo_sm ? <AvatarImage src={g.photo_sm} alt={g.name ?? ""} /> : null}
                        <AvatarFallback className="text-[9px]">
                          {(g.name ?? "").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{g.name}</TooltipContent>
                  </Tooltip>
                ))}
                {guests.length > 4 && (
                  <div className="size-5 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-[9px] text-muted-foreground">
                    +{guests.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FramePanel>
    </Frame>
  )
}

// ─── Kanban board ──────────────────────────────────────────────────────────────

interface AttendanceKanbanProps {
  attendances: Attendance[]
  isLoading: boolean
  onEdit?: (a: Attendance) => void
  onDelete?: (id: number) => void
  onStatusChange?: (id: number, newStatus: Attendance["status"]) => void
  onReorderAll?: (flat: Attendance[]) => void
}

export function AttendanceKanban({
  attendances,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
  onReorderAll,
}: AttendanceKanbanProps) {
  const [columns, setColumns] = useState<Record<string, Attendance[]>>({
    aberto: [],
    em_andamento: [],
    resolvido: [],
  })

  // Sync external attendances into columns
  useEffect(() => {
    setColumns({
      aberto:       attendances.filter((a) => a.status === "aberto"),
      em_andamento: attendances.filter((a) => a.status === "em_andamento"),
      resolvido:    attendances.filter((a) => a.status === "resolvido"),
    })
  }, [attendances])

  const handleValueChange = (next: Record<string, Attendance[]>) => {
    let hadStatusChange = false

    for (const [colId, items] of Object.entries(next)) {
      for (const item of items) {
        if (item.status !== colId) {
          hadStatusChange = true
          api.put(`/attendances/${item.id}`, { status: colId }).catch(() => {})
          onStatusChange?.(item.id, colId as Attendance["status"])
          item.status = colId as Attendance["status"]
        }
      }
    }

    // Within-column reorder — persist global order to the API and notify parent
    if (!hadStatusChange) {
      const flat = [
        ...(next.aberto ?? []),
        ...(next.em_andamento ?? []),
        ...(next.resolvido ?? []),
      ]
      const items = flat.map((a, i) => ({ id: a.id, order: i + 1 }))
      api.put("/attendances/reorder", { items }).catch(() => {})
      onReorderAll?.(flat)
    }

    setColumns(next)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Object.values(COLUMNS).map((col) => (
          <div key={col.title} className="flex flex-col gap-2">
            <div className="h-8 bg-muted rounded-lg animate-pulse" />
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Kanban
      value={columns}
      onValueChange={handleValueChange}
      getItemValue={(item) => String(item.id)}
    >
      <KanbanBoard className="grid grid-cols-3">
        {Object.entries(columns).map(([colId, items]) => {
          const col = COLUMNS[colId]
          return (
            <KanbanColumn key={colId} value={colId}>
              <Frame spacing="sm" className="h-full bg-muted/50 dark:bg-card dark:border-border">
                <FrameHeader className="flex flex-row items-center gap-2 border-b border-border pb-2.5">
                  <div className={`size-2 rounded-full ${col.color}`} />
                  <FrameTitle>{col.title}</FrameTitle>
                  <Badge variant={col.variant} appearance="light" size="sm" className="ml-auto">
                    {items.length}
                  </Badge>
                </FrameHeader>
                <KanbanColumnContent
                  value={colId}
                  className="flex flex-col gap-2 p-2"
                >
                  {items.map((attendance) => (
                    <KanbanItem key={attendance.id} value={String(attendance.id)}>
                      <KanbanItemHandle>
                        <AttendanceCard
                          attendance={attendance}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </KanbanItemHandle>
                    </KanbanItem>
                  ))}
                </KanbanColumnContent>
              </Frame>
            </KanbanColumn>
          )
        })}
      </KanbanBoard>
      <KanbanOverlay className="bg-muted/20 border-2 border-dashed border-primary/40 h-20" />
    </Kanban>
  )
}
