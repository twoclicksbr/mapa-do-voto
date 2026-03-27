import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { BirthDatePicker } from "@/components/people/birth-date-picker";
import { Trash2, ChevronDown, Clock, Tag, User, AlignLeft } from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventType {
  id: number;
  name: string;
  color: string;
  all_day: boolean;
}

export interface AgendaEventFull {
  id: number;
  name: string;
  description: string | null;
  event_type_id: number | null;
  people_id: number | null;
  people_name: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  recurrence: string | null;
  modulo: string | null;
  active: boolean;
  people: { id: number; people_id: number; name: string | null; photo_sm: string | null; active: boolean }[];
}

interface Person {
  id: number;
  name: string;
  photo_sm?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function isoToDate(iso: string): string {
  const d = new Date(iso);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function isoToTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDurationMinutes(sd: string, st: string, ed: string, et: string): number {
  const start = new Date(`${sd}T${st}:00`);
  const end   = new Date(`${ed}T${et}:00`);
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function shiftDateTime(date: string, time: string, minutes: number): { date: string; time: string } {
  const dt = new Date(`${date}T${time}:00`);
  dt.setMinutes(dt.getMinutes() + minutes);
  return {
    date: [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, "0"), String(dt.getDate()).padStart(2, "0")].join("-"),
    time: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EventModalProps {
  open: boolean;
  event: AgendaEventFull | null;
  onClose: () => void;
  onSaved: () => void;
  eventTypes: EventType[];
  initialDate?: { date: string; time?: string; allDay?: boolean } | null;
}

export function EventModal({ open, event, onClose, onSaved, eventTypes, initialDate }: EventModalProps) {
  const [name,          setName]          = useState("");
  const [description,   setDescription]   = useState("");
  const [eventTypeId,   setEventTypeId]   = useState<number | null>(null);
  const [selectedPeople,  setSelectedPeople]  = useState<Person[]>([]);
  const [peopleQuery,     setPeopleQuery]     = useState("");
  const [showPeopleDrop,  setShowPeopleDrop]  = useState(false);
  const [highlightedIdx,  setHighlightedIdx]  = useState(-1);
  const dropdownRef  = useRef<HTMLUListElement>(null);
  const typeDropRef   = useRef<HTMLDivElement>(null);
  const typeListRef   = useRef<HTMLUListElement>(null);
  const [typeDropOpen,    setTypeDropOpen]    = useState(false);
  const [typeHighlighted, setTypeHighlighted] = useState(-1);

  // Build the full options list: [{id: null, label: "— Nenhum —"}, ...eventTypes]
  // used for keyboard nav


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeDropRef.current && !typeDropRef.current.contains(e.target as Node)) {
        setTypeDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [startDate,     setStartDate]     = useState(todayIso());
  const [startTime,     setStartTime]     = useState("09:00");
  const [endDate,       setEndDate]       = useState(todayIso());
  const [endTime,       setEndTime]       = useState("10:00");
  const [allDay,        setAllDay]        = useState(false);
  const [recurrence,    setRecurrence]    = useState("none");
  const [people,        setPeople]        = useState<Person[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  // Load people once
  useEffect(() => {
    api.get<Person[]>("/people").then((r) => setPeople(r.data)).catch(() => {});
  }, []);

  // Reset form when opening
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (event) {
      setName(event.name);
      setDescription(event.description ?? "");
      setEventTypeId(event.event_type_id);
      setSelectedPeople(
        (event.people ?? [])
          .filter((ep) => ep.active)
          .map((ep) => ({ id: ep.people_id, name: ep.name ?? "", photo_sm: ep.photo_sm }))
      );
      setStartDate(isoToDate(event.start_at));
      setStartTime(isoToTime(event.start_at));
      if (event.end_at) {
        setEndDate(isoToDate(event.end_at));
        setEndTime(isoToTime(event.end_at));
      } else {
        setEndDate(isoToDate(event.start_at));
        setEndTime("10:00");
      }
      setAllDay(event.all_day ?? false);
      setRecurrence(event.recurrence ?? "none");
    } else {
      const date    = initialDate?.date ?? todayIso();
      const time    = initialDate?.time ?? "09:00";
      const isAllDay = initialDate?.allDay ?? false;
      const endTime = shiftDateTime(date, time, 60);
      setName("");
      setDescription("");
      setEventTypeId(null);
      setSelectedPeople([]);
      setPeopleQuery("");
      setStartDate(date);
      setStartTime(time);
      setEndDate(endTime.date);
      setEndTime(endTime.time);
      setAllDay(isAllDay);
      setRecurrence("none");
    }
  }, [open, event, eventTypes, initialDate]);

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${event.id}`);
      onSaved();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        name,
        description:    description || null,
        event_type_id:  eventTypeId,
        people_ids:     selectedPeople.map((p) => p.id),
        all_day:        allDay,
        recurrence:     recurrence,
        start_at:       allDay ? `${startDate}T00:00:00` : combineDateTime(startDate, startTime),
        end_at:         allDay ? null : combineDateTime(endDate, endTime),
        active:         true,
      };

      if (event) {
        await api.put(`/events/${event.id}`, payload);
      } else {
        await api.post("/events", payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const apiErrors = axiosErr?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(apiErrors)) {
          flat[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(flat);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedIds    = new Set(selectedPeople.map((p) => p.id));
  const filteredPeople = people.filter(
    (p) => !selectedIds.has(p.id) && p.name.toLowerCase().includes(peopleQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">

          {/* ── Título ── */}
          <div className="px-6 pt-6 pb-5 border-b border-border">
            <input
              id="ev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adicionar título"
              autoFocus
              className="w-full text-xl font-medium bg-transparent outline-none border-b-2 border-border focus:border-primary pb-1.5 placeholder:text-muted-foreground/50 transition-colors"
            />
            {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name}</p>}
          </div>

          {/* ── Linhas ── */}
          <div className="px-6 py-4 space-y-0 divide-y divide-border/60">

            {/* Tipo */}
            {eventTypes.length > 0 && (
              <div className="flex items-center gap-4 py-3">
                <Tag className="size-4.5 text-muted-foreground flex-shrink-0" />
                <div ref={typeDropRef} className="relative flex-1">
                  {/* Trigger */}
                  {(() => {
                    // options: index 0 = Nenhum, 1..N = eventTypes
                    const typeOptions = [null, ...eventTypes.map((et) => et.id)];
                    const selectByIdx = (idx: number) => {
                      const id = typeOptions[idx] ?? null;
                      setEventTypeId(id);
                      const et = eventTypes.find((t) => t.id === id);
                      setAllDay(et?.all_day ?? false);
                      setTypeDropOpen(false);
                      setTypeHighlighted(-1);
                    };
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => { setTypeDropOpen((o) => !o); setTypeHighlighted(-1); }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              if (!typeDropOpen) { setTypeDropOpen(true); setTypeHighlighted(0); return; }
                              setTypeHighlighted((prev) => {
                                const next = Math.min(prev + 1, typeOptions.length - 1);
                                (typeListRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" });
                                return next;
                              });
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              if (!typeDropOpen) return;
                              setTypeHighlighted((prev) => {
                                const next = Math.max(prev - 1, 0);
                                (typeListRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" });
                                return next;
                              });
                            } else if (e.key === "Enter" && typeDropOpen && typeHighlighted >= 0) {
                              e.preventDefault();
                              selectByIdx(typeHighlighted);
                            } else if (e.key === "Escape") {
                              setTypeDropOpen(false);
                            }
                          }}
                          className="w-full h-9 flex items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {eventTypeId ? (
                            <>
                              <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: eventTypes.find((et) => et.id === eventTypeId)?.color }} />
                              <span className="flex-1 text-left">{eventTypes.find((et) => et.id === eventTypeId)?.name}</span>
                            </>
                          ) : (
                            <span className="flex-1 text-left text-muted-foreground">— Nenhum —</span>
                          )}
                          <ChevronDown className="size-3.5 text-muted-foreground ml-auto" />
                        </button>
                        {typeDropOpen && (
                          <ul ref={typeListRef} className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md overflow-hidden">
                            <li
                              onMouseEnter={() => setTypeHighlighted(0)}
                              onMouseDown={() => selectByIdx(0)}
                              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-muted-foreground ${typeHighlighted === 0 ? "bg-accent" : "hover:bg-accent"}`}
                            >
                              — Nenhum —
                            </li>
                            {eventTypes.map((et, i) => (
                              <li
                                key={et.id}
                                onMouseEnter={() => setTypeHighlighted(i + 1)}
                                onMouseDown={() => selectByIdx(i + 1)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${typeHighlighted === i + 1 ? "bg-accent" : (et.id === eventTypeId ? "bg-accent/60" : "hover:bg-accent")}`}
                              >
                                <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
                                {et.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Data / Hora */}
            <div className="flex items-start gap-4 py-3">
              <Clock className="size-4.5 text-muted-foreground mt-2 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <BirthDatePicker
                    value={startDate}
                    onChange={(newDate) => {
                      const dur = getDurationMinutes(startDate, startTime, endDate, endTime);
                      setStartDate(newDate);
                      if (allDay) {
                        setEndDate(newDate);
                      } else if (dur > 0) {
                        const { date, time } = shiftDateTime(newDate, startTime, dur);
                        setEndDate(date);
                        setEndTime(time);
                      }
                    }}
                    minYear={2020}
                    maxYear={2035}
                  />
                  {!allDay && (
                    <select
                      value={startTime}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const dur = getDurationMinutes(startDate, startTime, endDate, endTime);
                        setStartTime(newTime);
                        if (dur > 0) {
                          const { date, time } = shiftDateTime(startDate, newTime, dur);
                          setEndDate(date);
                          setEndTime(time);
                        }
                      }}
                      className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                  {!allDay && (
                    <>
                      <BirthDatePicker value={endDate} onChange={setEndDate} minYear={2020} maxYear={2035} />
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox id="ev-allday" checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
                    <Label htmlFor="ev-allday" className="cursor-pointer font-normal text-sm text-muted-foreground">Dia inteiro</Label>
                  </div>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm text-muted-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="none">Não repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                    <option value="yearly">Anualmente</option>
                  </select>
                </div>
                {errors.start_at && <p className="text-xs text-destructive">{errors.start_at}</p>}
              </div>
            </div>

            {/* Pessoas */}
            <div className="flex items-start gap-4 py-3">
              <User className="size-4.5 text-muted-foreground mt-2.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                {/* Chips das pessoas selecionadas */}
                {selectedPeople.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPeople.map((p) => (
                      <span key={p.id} className="flex items-center gap-1.5 bg-muted rounded-full pl-0.5 pr-2.5 py-0.5 text-xs font-medium">
                        {p.photo_sm ? (
                          <img src={p.photo_sm} alt={p.name} className="size-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        {p.name}
                        <button
                          type="button"
                          onClick={() => setSelectedPeople((prev) => prev.filter((x) => x.id !== p.id))}
                          className="ml-0.5 text-muted-foreground hover:text-foreground leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Input de busca */}
                <div className="relative">
                  <Input
                    id="ev-people"
                    value={peopleQuery}
                    onChange={(e) => { setPeopleQuery(e.target.value); setShowPeopleDrop(true); setHighlightedIdx(-1); }}
                    onFocus={() => setShowPeopleDrop(true)}
                    onBlur={() => setTimeout(() => setShowPeopleDrop(false), 150)}
                    onKeyDown={(e) => {
                      if (!showPeopleDrop || filteredPeople.length === 0) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightedIdx((prev) => { const next = Math.min(prev + 1, filteredPeople.length - 1); (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" }); return next; });
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightedIdx((prev) => { const next = Math.max(prev - 1, 0); (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" }); return next; });
                      } else if (e.key === "Enter" && highlightedIdx >= 0) {
                        e.preventDefault();
                        const sel = filteredPeople[highlightedIdx];
                        if (sel) { setSelectedPeople((prev) => [...prev, sel]); setPeopleQuery(""); setShowPeopleDrop(false); setHighlightedIdx(-1); }
                      } else if (e.key === "Escape") { setShowPeopleDrop(false); }
                    }}
                    placeholder="Adicionar pessoa..."
                    autoComplete="off"
                  />
                  {showPeopleDrop && peopleQuery.length > 0 && (
                    <ul ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-48 overflow-y-auto">
                      {filteredPeople.length > 0 ? filteredPeople.map((p, idx) => (
                        <li
                          key={p.id}
                          onMouseEnter={() => setHighlightedIdx(idx)}
                          onMouseDown={() => { setSelectedPeople((prev) => [...prev, p]); setPeopleQuery(""); setShowPeopleDrop(false); setHighlightedIdx(-1); }}
                          className={`flex items-center gap-2.5 cursor-pointer px-3 py-2 text-sm ${idx === highlightedIdx ? "bg-accent" : "hover:bg-accent"}`}
                        >
                          {p.photo_sm ? (
                            <img src={p.photo_sm} alt={p.name} className="size-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {p.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          {p.name}
                        </li>
                      )) : (
                        <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="flex items-start gap-4 py-3">
              <AlignLeft className="size-4.5 text-muted-foreground mt-2 flex-shrink-0" />
              <Textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicionar descrição..."
                rows={2}
                className="resize-none flex-1 border-0 shadow-none px-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50"
              />
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div>
              {event && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading || deleting}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading || deleting || !name.trim()}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
