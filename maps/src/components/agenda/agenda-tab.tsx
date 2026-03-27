import { useRef, useCallback, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, FileText, Plus } from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventType {
  id: number;
  name: string;
  color: string;
}

interface AgendaEvent {
  id: number;
  name: string;
  description: string | null;
  event_type_id: number;
  event_type: EventType | null;
  people_id: number;
  people_name: string | null;
  start_at: string;
  end_at: string | null;
  modulo: string | null;
  active: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR") +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose }: { event: AgendaEvent | null; onClose: () => void }) {
  if (!event) return null;
  const color = event.event_type?.color ?? "#6b7280";

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {event.name}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {event.event_type && (
            <Badge className="text-xs font-medium text-white border-0" style={{ backgroundColor: color }}>
              {event.event_type.name}
            </Badge>
          )}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Início:</span>
              <span>{formatDateTime(event.start_at)}</span>
            </div>
            {event.end_at && (
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Fim:</span>
                <span>{formatDateTime(event.end_at)}</span>
              </div>
            )}
          </div>
          {event.people_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="size-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Responsável:</span>
              <span>{event.people_name}</span>
            </div>
          )}
          {event.modulo && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Módulo:</span>
              <span className="capitalize">{event.modulo}</span>
            </div>
          )}
          {event.description && (
            <div className="rounded-md bg-muted/60 p-3 text-sm whitespace-pre-wrap">
              {event.description}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AgendaSidebar({
  todayEvents,
  eventTypes,
  onEventClick,
}: {
  todayEvents: AgendaEvent[];
  eventTypes: EventType[];
  onEventClick: (ev: AgendaEvent) => void;
}) {
  const today = new Date();
  const dayName = today.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateLabel = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-card">
      {/* Date header */}
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground capitalize">{dayName}</p>
          <p className="text-sm font-semibold text-foreground">{dateLabel}</p>
        </div>
        <button className="size-7 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors">
          <Plus className="size-4" />
        </button>
      </div>

      {/* Today events */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-4">
        {todayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-2">Nenhum evento hoje</p>
        ) : (
          todayEvents.map((ev) => {
            const color = ev.event_type?.color ?? "#6b7280";
            return (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev)}
                className="w-full text-left rounded-md p-2 pl-3 text-sm relative hover:bg-muted transition-colors"
                style={{
                  borderLeft: `3px solid ${color}`,
                  backgroundColor: hexToRgba(color, 0.07),
                }}
              >
                <p className="font-medium text-foreground leading-tight">{ev.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTime(ev.start_at)}
                  {ev.end_at ? ` – ${formatTime(ev.end_at)}` : ""}
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* Event types legend */}
      {eventTypes.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Tipos</p>
          <div className="space-y-1.5">
            {eventTypes.map((et) => (
              <div key={et.id} className="flex items-center gap-2">
                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
                <span className="text-xs text-foreground">{et.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AgendaTab() {
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [todayEvents,   setTodayEvents]   = useState<AgendaEvent[]>([]);
  const [eventTypes,    setEventTypes]    = useState<EventType[]>([]);

  // Load sidebar data once
  useEffect(() => {
    const today = todayIso();
    api
      .get<AgendaEvent[]>("/events", { params: { start_from: `${today}T00:00:00`, start_to: `${today}T23:59:59` } })
      .then((r) => setTodayEvents(r.data))
      .catch(() => {});

    api
      .get<EventType[]>("/event-types")
      .then((r) => setEventTypes(r.data))
      .catch(() => {});
  }, []);

  const loadEvents = useCallback(
    async (
      info: { startStr: string; endStr: string },
      successCallback: (events: object[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      try {
        const res = await api.get<AgendaEvent[]>("/events", {
          params: { start_from: info.startStr, start_to: info.endStr },
        });

        successCallback(
          res.data.map((ev) => {
            const color = ev.event_type?.color ?? "#6b7280";
            return {
              id:              String(ev.id),
              title:           ev.name,
              start:           ev.start_at,
              end:             ev.end_at ?? undefined,
              backgroundColor: hexToRgba(color, 0.15),
              borderColor:     color,
              textColor:       color,
              extendedProps:   ev,
            };
          })
        );
      } catch (err) {
        failureCallback(err as Error);
      }
    },
    []
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedEvent(arg.event.extendedProps as AgendaEvent);
  }, []);

  const handleDatesSet = useCallback((_arg: DatesSetArg) => {}, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Card wrapper — two-column layout */}
      <div className="flex-1 min-h-0 m-4 rounded-xl border border-border bg-card shadow-sm flex overflow-hidden">

        <AgendaSidebar
          todayEvents={todayEvents}
          eventTypes={eventTypes}
          onEventClick={setSelectedEvent}
        />

        {/* Calendar */}
        <div className="flex-1 min-w-0 overflow-auto p-5">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            locale={ptBrLocale}
            initialView="dayGridMonth"
            headerToolbar={{
              left:   "prev,next today",
              center: "title",
              right:  "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={loadEvents}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            editable={false}
            selectable={false}
            dayMaxEvents={4}
            nowIndicator
            height="100%"
            eventDisplay="block"
          />
        </div>
      </div>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
