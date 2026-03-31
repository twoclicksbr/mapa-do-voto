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
import { CalendarDays, Clock, User, Plus, ChevronDown, Pencil, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { EventModal, AgendaEventFull } from "./event-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventType {
  id: number;
  name: string;
  color: string;
  all_day: boolean;
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
  all_day: boolean;
  modulo: string | null;
  active: boolean;
}

interface FinTitleEvent {
  id: number;
  type: "income" | "expense";
  invoice_number: string | null;
  document_number: string | null;
  amount: number;
  due_date: string;
  people_name: string | null;
  status: string;
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
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose, onEdit }: { event: AgendaEvent | null; onClose: () => void; onEdit: (ev: AgendaEvent) => void }) {
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
              <span className="text-muted-foreground">Pessoa:</span>
              <span>{event.people_name}</span>
            </div>
          )}
          {event.description && (
            <div className="rounded-md bg-muted/60 p-3 text-sm whitespace-pre-wrap">
              {event.description}
            </div>
          )}
          {!event.modulo && (
            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={() => onEdit(event)}>
                <Pencil className="size-3.5" />
                Editar
              </Button>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// ─── FinTitle Detail Modal ────────────────────────────────────────────────────

function FinTitleDetailModal({ title, finColor, onClose }: { title: FinTitleEvent | null; finColor: string; onClose: () => void }) {
  if (!title) return null;
  const isIncome = title.type === "income";
  const label    = isIncome ? "Receber" : "Pagar";
  const amount   = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(title.amount);
  const due      = new Date(`${title.due_date}T00:00:00`).toLocaleDateString("pt-BR");

  return (
    <Dialog open={!!title} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-4 text-muted-foreground flex-shrink-0" />
            {title.invoice_number ?? title.document_number ?? `#${title.id}`}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Badge className="text-xs font-medium text-white border-0" style={{ backgroundColor: finColor }}>
            {label}
          </Badge>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Vencimento:</span>
              <span>{due}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="size-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">{amount}</span>
            </div>
            {title.people_name && (
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Pessoa:</span>
                <span>{title.people_name}</span>
              </div>
            )}
          </div>
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
  onNewEvent,
}: {
  todayEvents: AgendaEvent[];
  eventTypes: EventType[];
  onEventClick: (ev: AgendaEvent) => void;
  onNewEvent: () => void;
}) {
  const today = new Date();
  const dayName = today.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateLabel = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-muted/40">
      {/* Date header */}
      <div className="px-4 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground capitalize">{dayName}</p>
          <p className="text-sm font-semibold text-foreground">{dateLabel}</p>
        </div>
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

// ─── View Switcher ────────────────────────────────────────────────────────────

const VIEWS = [
  { key: "dayGridMonth",  label: "Mês" },
  { key: "timeGridWeek",  label: "Semana" },
  { key: "timeGridDay",   label: "Dia" },
  { key: "listWeek",      label: "Lista" },
] as const;

function ViewSwitcher({
  currentView,
  onChange,
}: {
  currentView: string;
  onChange: (view: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = VIEWS.find((v) => v.key === currentView) ?? VIEWS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground transition-colors"
      >
        {current.label}
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-md overflow-hidden min-w-[7rem]">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => { onChange(v.key); setOpen(false); }}
              className={[
                "w-full text-left px-3 py-2 text-xs font-medium transition-colors",
                v.key === currentView
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dia label injection ───────────────────────────────────────────────────────

function injectDiaLabel(wrapper: HTMLElement | null) {
  if (!wrapper) return;
  // The header axis cell is a <th class="fc-timegrid-axis"> (not fc-col-header-cell)
  const frame = wrapper.querySelector<HTMLElement>(
    "th.fc-timegrid-axis .fc-timegrid-axis-frame"
  );
  if (!frame) return;
  if (frame.querySelector(".fc-dia-label")) return;
  const span = document.createElement("span");
  span.className = "fc-dia-label";
  span.textContent = "hora";
  frame.appendChild(span);
}

interface CalendarPerson {
  id: number;
  name: string;
  birth_date: string | null;
}

export function AgendaTab() {
  const calendarRef = useRef<FullCalendar>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const [selectedEvent,    setSelectedEvent]    = useState<AgendaEvent | null>(null);
  const [selectedFinTitle, setSelectedFinTitle] = useState<FinTitleEvent | null>(null);
  const [todayEvents,      setTodayEvents]      = useState<AgendaEvent[]>([]);
  const [eventTypes,       setEventTypes]       = useState<EventType[]>([]);
  const [calendarPeople,   setCalendarPeople]   = useState<CalendarPerson[]>([]);
  const [currentView,   setCurrentView]   = useState("dayGridMonth");
  const [eventModalOpen,    setEventModalOpen]    = useState(false);
  const [editingEvent,      setEditingEvent]      = useState<AgendaEventFull | null>(null);
  const [clickedDate,       setClickedDate]       = useState<{ date: string; time?: string; allDay?: boolean } | null>(null);

  // Load sidebar data + event types + people once
  useEffect(() => {
    const today = todayIso();
    api
      .get<AgendaEvent[]>("/events", { params: { start_from: `${today}T00:00:00`, start_to: `${today}T23:59:59` } })
      .then((r) => setTodayEvents(r.data.filter(ev => ev.modulo !== "people")))
      .catch(() => {});

    api
      .get<EventType[]>("/event-types")
      .then((r) => setEventTypes(r.data))
      .catch(() => {});

    api
      .get<CalendarPerson[]>("/people")
      .then((r) => setCalendarPeople(r.data))
      .catch(() => {});
  }, []);

  const finPayColor     = eventTypes.find(t => t.name.toLowerCase().includes("pagar"))?.color   ?? "#ec637f";
  const finReceiveColor = eventTypes.find(t => t.name.toLowerCase().includes("receber"))?.color ?? "#4fb589";

  const loadEvents = useCallback(
    async (
      info: { startStr: string; endStr: string },
      successCallback: (events: object[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      try {
        const dateFrom = info.startStr.slice(0, 10);
        const dateTo   = info.endStr.slice(0, 10);

        const [eventsRes, titlesRes] = await Promise.all([
          api.get<AgendaEvent[]>("/events", {
            params: { start_from: info.startStr, start_to: info.endStr },
          }),
          api.get<FinTitleEvent[]>("/fin-titles", {
            params: { status: "pending", date_from: dateFrom, date_to: dateTo },
          }),
        ]);

        // Exclude events stored with modulo='people' (old birthday records) — birthdays now generated dynamically
        const regularEvents = eventsRes.data.filter(ev => ev.modulo !== "people").map((ev) => {
          const color = ev.event_type?.color ?? "#6b7280";
          return {
            id:              String((ev as AgendaEvent & { _fc_id?: string })._fc_id ?? ev.id),
            title:           ev.name,
            start:           ev.start_at,
            end:             ev.end_at ?? undefined,
            allDay:          ev.all_day ?? false,
            backgroundColor: hexToRgba(color, 0.15),
            borderColor:     color,
            textColor:       color,
            extendedProps:   { _type: "event", ...ev },
          };
        });

        const titleEvents = titlesRes.data.map((t) => {
          const color = t.type === "income" ? finReceiveColor : finPayColor;
          const label = t.invoice_number ?? t.document_number ?? `#${t.id}`;
          return {
            id:              `fin-${t.id}`,
            title:           `${t.type === "income" ? "Receber" : "Pagar"}: ${label}`,
            start:           t.due_date,
            allDay:          true,
            backgroundColor: hexToRgba(color, 0.15),
            borderColor:     color,
            textColor:       color,
            extendedProps:   { _type: "fin_title", ...t },
          };
        });

        // Generate birthday events dynamically from people.birth_date
        const birthdayType = eventTypes.find(t => t.name.toLowerCase().includes("anivers"));
        const bdColor = birthdayType?.color ?? "#3fb6ea";
        const rangeFrom = new Date(dateFrom + "T00:00:00");
        const rangeTo   = new Date(dateTo   + "T00:00:00");
        const birthdayEvents: object[] = [];
        for (const person of calendarPeople) {
          if (!person.birth_date) continue;
          const [, bdMonth, bdDay] = person.birth_date.split("-");
          const yearStart = rangeFrom.getFullYear();
          const yearEnd   = rangeTo.getFullYear();
          for (let year = yearStart; year <= yearEnd; year++) {
            const dateStr = `${year}-${bdMonth}-${bdDay}`;
            const d = new Date(dateStr + "T00:00:00");
            if (d >= rangeFrom && d <= rangeTo) {
              birthdayEvents.push({
                id:              `birthday-${person.id}-${year}`,
                title:           `Aniversário de ${person.name}`,
                start:           dateStr,
                allDay:          true,
                backgroundColor: hexToRgba(bdColor, 0.15),
                borderColor:     bdColor,
                textColor:       bdColor,
                extendedProps: {
                  _type:      "birthday",
                  id:         person.id,
                  name:       `Aniversário de ${person.name}`,
                  event_type: birthdayType ?? null,
                  people_name: person.name,
                  start_at:   dateStr + "T00:00:00",
                  end_at:     null,
                  all_day:    true,
                  modulo:     "people",
                  description: null,
                  active:     true,
                },
              });
            }
          }
        }

        successCallback([...regularEvents, ...titleEvents, ...birthdayEvents]);

        // Sync sidebar: if fetched range includes today, filter from already-fetched data
        const todayStr = todayIso();
        if (info.startStr.slice(0, 10) <= todayStr && info.endStr.slice(0, 10) > todayStr) {
          setTodayEvents(eventsRes.data.filter(ev => ev.modulo !== "people" && ev.start_at.slice(0, 10) === todayStr));
        }
      } catch (err) {
        failureCallback(err as Error);
      }
    },
    [finPayColor, finReceiveColor, eventTypes, calendarPeople]
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = arg.event.extendedProps as { _type?: string } & AgendaEvent & FinTitleEvent;
    if (props._type === "fin_title") {
      setSelectedFinTitle(props as unknown as FinTitleEvent);
    } else {
      setSelectedEvent(props as unknown as AgendaEvent);
    }
  }, []);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCurrentView(arg.view.type);
    setTimeout(() => injectDiaLabel(wrapperRef.current), 100);
  }, []);

  const handleChangeView = useCallback((view: string) => {
    calendarRef.current?.getApi().changeView(view, new Date());
    setCurrentView(view);
  }, []);

  const handleNewEvent = useCallback(() => {
    const now = new Date();
    const next = new Date(now);
    if (now.getMinutes() > 0) { next.setHours(now.getHours() + 1); }
    next.setMinutes(0, 0, 0);
    const date = [next.getFullYear(), String(next.getMonth()+1).padStart(2,"0"), String(next.getDate()).padStart(2,"0")].join("-");
    const time = `${String(next.getHours()).padStart(2,"0")}:00`;
    setEditingEvent(null);
    setClickedDate({ date, time });
    setEventModalOpen(true);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Card wrapper — two-column layout */}
      <div className="flex-1 min-h-0 m-4 rounded-xl border border-border/60 bg-muted/20 shadow-sm flex overflow-hidden">

        <AgendaSidebar
          todayEvents={todayEvents}
          eventTypes={eventTypes}
          onEventClick={setSelectedEvent}
          onNewEvent={handleNewEvent}
        />

        {/* Calendar */}
        <div ref={wrapperRef} className="flex-1 min-w-0 overflow-auto p-5 relative">
          <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
            <ViewSwitcher currentView={currentView} onChange={handleChangeView} />
            <button
              onClick={handleNewEvent}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Novo Evento
            </button>
          </div>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            locale={ptBrLocale}
            initialView="dayGridMonth"
            headerToolbar={{
              left:   "prev,next today title",
              center: "",
              right:  "",
            }}
            slotLabelInterval="00:30:00"
            slotLabelContent={(arg) => {
              const h = String(arg.date.getHours()).padStart(2, "0");
              const m = arg.date.getMinutes() === 30 ? "30" : "00";
              return `${h}:${m}`;
            }}
            events={loadEvents}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            dateClick={(arg) => {
              const d = arg.date;
              const date = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
              let time: string;
              if (arg.allDay) {
                // Mês: usa próxima hora cheia baseada na hora atual
                const now = new Date();
                const nextHour = now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours();
                time = `${String(nextHour).padStart(2,"0")}:00`;
              } else {
                // Semana/Dia: usa o slot clicado arredondado
                const mins = d.getMinutes();
                const roundedMins = mins < 15 ? "00" : mins < 45 ? "30" : "00";
                const roundedHour = mins >= 45 ? d.getHours() + 1 : d.getHours();
                time = `${String(roundedHour).padStart(2,"0")}:${roundedMins}`;
              }
              setClickedDate({ date, time, allDay: false });
              setEditingEvent(null);
              setEventModalOpen(true);
            }}
            allDaySlot={true}
            editable={false}
            selectable={false}
            dayMaxEvents={4}
            nowIndicator
            height="100%"
            eventDisplay="block"
          />
        </div>
      </div>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(ev) => {
          setSelectedEvent(null);
          setEditingEvent(ev as unknown as AgendaEventFull);
          setEventModalOpen(true);
        }}
      />

      <FinTitleDetailModal
        title={selectedFinTitle}
        finColor={selectedFinTitle?.type === "income" ? finReceiveColor : finPayColor}
        onClose={() => setSelectedFinTitle(null)}
      />

      <EventModal
        open={eventModalOpen}
        event={editingEvent}
        eventTypes={eventTypes}
        initialDate={editingEvent ? null : clickedDate}
        onClose={() => { setEventModalOpen(false); setEditingEvent(null); setClickedDate(null); }}
        onSaved={() => {
          calendarRef.current?.getApi().refetchEvents();
          // Reload sidebar today events
          const today = todayIso();
          api.get<AgendaEvent[]>("/events", { params: { start_from: `${today}T00:00:00`, start_to: `${today}T23:59:59` } })
            .then((r) => setTodayEvents(r.data))
            .catch(() => {});
        }}
      />
    </div>
  );
}
