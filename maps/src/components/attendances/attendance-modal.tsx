import { useState, useEffect, useRef } from "react";
import {
  ContactsTab, NotesTab, DocumentsTab, AddressesTab,
  ContactItem, AddressItem, DocumentItem, NoteItem,
} from "@/components/common/entity-tabs";
import { TypeContact } from "@/components/type-contacts/type-contacts-data-grid";
import { TypeAddress } from "@/components/type-addresses/type-addresses-data-grid";
import { TypeDocument } from "@/components/type-documents/type-documents-data-grid";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pencil, Plus, X, StickyNote, Phone,
  FileText, MapPin, Folder, UserRoundPlus,
} from "lucide-react";
import { PeopleFilesTab } from "@/components/people/people-files-tab";
import { PeopleModal } from "@/components/people/people-modal";
import { TypePeople } from "@/components/type-people/type-people-data-grid";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import type { Attendance, AttendancePerson } from "./attendance-data-grid";


// ─── Status / Priority helpers ────────────────────────────────────────────────

const STATUS_ITEMS = [
  { value: "aberto",       label: "Aberto",       variant: "destructive" as const },
  { value: "em_andamento", label: "Em Andamento", variant: "warning"     as const },
  { value: "resolvido",    label: "Resolvido",    variant: "success"     as const },
];

const PRIORITY_ITEMS = [
  { value: "alta",  label: "Alta",  color: "bg-red-500"    },
  { value: "media", label: "Média", color: "bg-yellow-500" },
  { value: "baixa", label: "Baixa", color: "bg-green-500"  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AttendanceModalProps {
  open: boolean;
  attendance: Attendance | null;
  onClose: () => void;
  onSaved: (a: Attendance, justCreated?: boolean) => void;
}



// ─── Create Modal (small) ─────────────────────────────────────────────────────

interface PersonRef { id: number; name: string; photo_sm?: string | null }

function CreateAttendanceModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (a: Attendance, justCreated?: boolean) => void;
}) {
  const [title, setTitle]       = useState("");
  const [status, setStatus]     = useState("aberto");
  const [priority, setPriority] = useState("media");
  const [loading, setLoading]   = useState(false);

  const [people,         setPeople]         = useState<PersonRef[]>([]);
  const [peopleId,       setPeopleId]       = useState<number | undefined>();
  const [peopleQuery,    setPeopleQuery]    = useState("");
  const [showDrop,       setShowDrop]       = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const [showCreatePeople, setShowCreatePeople] = useState(false);
  const [typePeople,       setTypePeople]       = useState<import("@/components/type-people/type-people-data-grid").TypePeople[]>([]);

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(peopleQuery.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setStatus("aberto");
    setPriority("media");
    setPeopleId(undefined);
    setPeopleQuery("");
    api.get<PersonRef[]>("/people").then((r) => setPeople(r.data)).catch(() => {});
    api.get("/type-people").then((r) => setTypePeople(r.data)).catch(() => {});
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post<Attendance>("/attendances", {
        title,
        status,
        priority,
        people_id: peopleId ?? null,
      });
      onSaved(res.data, true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <>
    <PeopleModal
      open={showCreatePeople}
      person={null}
      typePeople={typePeople}
      typeContacts={[]}
      typeAddresses={[]}
      typeDocuments={[]}
      onClose={() => setShowCreatePeople(false)}
      onSaved={(saved) => {
        setPeople((prev) => [...prev, { id: saved.id, name: saved.name, photo_sm: saved.photo_sm ?? null }]);
        setPeopleId(saved.id);
        setPeopleQuery(saved.name);
        setShowCreatePeople(false);
      }}
    />
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ca-title">Título</Label>
              <Input
                id="ca-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Descreva o atendimento"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Pessoa</Label>
                <button
                  type="button"
                  onClick={() => setShowCreatePeople(true)}
                  className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Nova pessoa"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="relative">
                <Input
                  value={peopleQuery}
                  onChange={(e) => { setPeopleQuery(e.target.value); setPeopleId(undefined); setShowDrop(true); setHighlightedIdx(-1); }}
                  onFocus={() => setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                  onKeyDown={(e) => {
                    if (!showDrop || filteredPeople.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedIdx(prev => { const next = Math.min(prev + 1, filteredPeople.length - 1); (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" }); return next; });
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedIdx(prev => { const next = Math.max(prev - 1, 0); (dropdownRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" }); return next; });
                    } else if (e.key === "Enter" && highlightedIdx >= 0) {
                      e.preventDefault();
                      const sel = filteredPeople[highlightedIdx];
                      if (sel) { setPeopleId(sel.id); setPeopleQuery(sel.name); setShowDrop(false); setHighlightedIdx(-1); }
                    } else if (e.key === "Escape") {
                      setShowDrop(false); setHighlightedIdx(-1);
                    }
                  }}
                  placeholder="Digite para buscar..."
                  autoComplete="off"
                />
                {showDrop && peopleQuery.length > 0 && (
                  <ul ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-48 overflow-y-auto">
                    {filteredPeople.map((p, idx) => (
                      <li key={p.id}
                        onMouseEnter={() => setHighlightedIdx(idx)}
                        onMouseDown={() => { setPeopleId(p.id); setPeopleQuery(p.name); setShowDrop(false); setHighlightedIdx(-1); }}
                        className={`cursor-pointer px-3 py-2 text-sm ${idx === highlightedIdx ? "bg-accent" : "hover:bg-accent"}`}>
                        {p.name}
                      </li>
                    ))}
                    {filteredPeople.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado</li>}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca-status">Status</Label>
              <Select value={status} onValueChange={setStatus} indicatorPosition="right">
                <SelectTrigger id="ca-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <Badge variant={s.variant} appearance="light" size="sm">{s.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca-priority">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority} indicatorPosition="right">
                <SelectTrigger id="ca-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_ITEMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={`size-3 rounded-full ${p.color}`} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={loading || !title.trim()}>
              {loading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ─── Detail Modal (large) ─────────────────────────────────────────────────────

function AttendanceDetailModal({
  open,
  attendance,
  onClose,
  onSaved,
}: {
  open: boolean;
  attendance: Attendance;
  onClose: () => void;
  onSaved: (a: Attendance) => void;
}) {
  const [editMode, setEditMode]   = useState(false);
  const [title, setTitle]         = useState(attendance.title);
  const [status, setStatus]       = useState<string>(attendance.status);
  const [priority, setPriority]   = useState<string>(attendance.priority);
  const [saving, setSaving]       = useState(false);

  const [people,          setPeople]         = useState<PersonRef[]>([]);
  const [peopleId,        setPeopleId]       = useState<number | undefined>(attendance.people_id ?? undefined);
  const [peopleQuery,     setPeopleQuery]    = useState(attendance.people_name ?? "");
  const [showDrop,        setShowDrop]       = useState(false);
  const [highlightedIdx,  setHighlightedIdx] = useState(-1);
  const editDropRef = useRef<HTMLUListElement>(null);

  const [notes, setNotes]         = useState<NoteItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [contacts, setContacts]   = useState<ContactItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [typeContacts, setTypeContacts]     = useState<TypeContact[]>([]);
  const [typeDocuments, setTypeDocuments]   = useState<TypeDocument[]>([]);
  const [typeAddresses, setTypeAddresses]   = useState<TypeAddress[]>([]);
  const [tabsLoading, setTabsLoading]       = useState(true);

  const [current, setCurrent] = useState<Attendance>(attendance);

  const [guestsOpen,    setGuestsOpen]    = useState(false);
  const [showCreatePeople, setShowCreatePeople] = useState(false);
  const [typePeople,    setTypePeople]    = useState<TypePeople[]>([]);
  const [guests,        setGuests]        = useState<AttendancePerson[]>(attendance.people ?? []);
  const [guestQuery,    setGuestQuery]    = useState("");

  const guestInputRef = useRef<HTMLInputElement>(null);
  const [guestHighlight, setGuestHighlight] = useState(-1);

  const filteredGuestOptions = people.filter(
    (p) =>
      p.name.toLowerCase().includes(guestQuery.toLowerCase()) &&
      !guests.some((g) => g.people_id === p.id)
  );

  useEffect(() => {
    if (!open) return;
    setCurrent(attendance);
    setTitle(attendance.title);
    setStatus(attendance.status);
    setPriority(attendance.priority);
    setPeopleId(attendance.people_id ?? undefined);
    setPeopleQuery(attendance.people_name ?? "");
    setEditMode(false);
    setTabsLoading(true);

    api.get<PersonRef[]>("/people").then((r) => setPeople(r.data)).catch(() => {});

    Promise.all([
      api.get<NoteItem[]>(`/attendances/${attendance.id}/notes`),
      api.get<ContactItem[]>(`/attendances/${attendance.id}/contacts`),
      api.get<DocumentItem[]>(`/attendances/${attendance.id}/documents`),
      api.get<AddressItem[]>(`/attendances/${attendance.id}/addresses`),
      api.get<TypeContact[]>("/type-contacts"),
      api.get<TypeDocument[]>("/type-documents"),
      api.get<TypeAddress[]>("/type-addresses"),
    ]).then(([n, c, d, a, tc, td, ta]) => {
      setNotes(n.data);
      setContacts(c.data);
      setDocuments(d.data);
      setAddresses(a.data);
      setTypeContacts(tc.data);
      setTypeDocuments(td.data);
      setTypeAddresses(ta.data);
    }).catch(() => {}).finally(() => setTabsLoading(false));
  }, [open, attendance]);

  const handleAddGuest = async (p: PersonRef) => {
    const optimistic: AttendancePerson = { id: 0, people_id: p.id, name: p.name, photo_sm: p.photo_sm ?? null, active: true };
    setGuests((prev) => [...prev, optimistic]);
    setGuestQuery("");
    setGuestHighlight(-1);
    try {
      const res = await api.post<AttendancePerson>(`/attendances/${attendance.id}/people`, { people_id: p.id });
      setGuests((prev) => {
        const updated = prev.map((g) => g.people_id === p.id && g.id === 0 ? res.data : g);
        onSaved({ ...current, people: updated });
        return updated;
      });
    } catch {
      setGuests((prev) => prev.filter((g) => !(g.people_id === p.id && g.id === 0)));
    }
  };

  const handleRemoveGuest = async (peopleId: number) => {
    try {
      await api.delete(`/attendances/${attendance.id}/people/${peopleId}`);
      setGuests((prev) => {
        const updated = prev.filter((g) => g.people_id !== peopleId);
        onSaved({ ...current, people: updated });
        return updated;
      });
    } catch {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await api.put<Attendance>(`/attendances/${attendance.id}`, { title, status, priority, people_id: peopleId ?? null });
      setCurrent(res.data);
      onSaved(res.data);
      setEditMode(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const currentStatus   = STATUS_ITEMS.find((i) => i.value === current.status);
  const currentPriority = PRIORITY_ITEMS.find((p) => p.value === current.priority);
  const totalItems      = contacts.length + documents.length + notes.length;

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Atendimento</DialogTitle>

        {/* ── Sub-header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold leading-none">{current.title}</h1>
              {currentStatus && (
                <Badge variant={currentStatus.variant} appearance="light" size="md">
                  {currentStatus.label}
                </Badge>
              )}
              {currentPriority && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-3 rounded-full ${currentPriority.color}`} />
                  {currentPriority.label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              ID: <span className="font-mono">#{String(current.id).padStart(5, "0")}</span>
              {current.opened_at && (
                <> &bull; Abertura: <strong>{formatDate(current.opened_at)}</strong></>
              )}
              {totalItems > 0 && (
                <> &bull; {totalItems} {totalItems === 1 ? "registro" : "registros"}</>
              )}
              {current.people_name && (
                <> &bull; <span className="inline-flex items-center gap-1 align-middle">
                  {current.people_photo_sm ? (
                    <img src={current.people_photo_sm} alt={current.people_name} className="size-4 rounded-full object-cover" />
                  ) : (
                    <span className="size-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-semibold text-muted-foreground">
                      {current.people_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <strong>{current.people_name}</strong>
                </span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <div className="border-border rounded-full flex items-center gap-1.5 border p-1 shadow-sm shadow-black/5 cursor-pointer hover:bg-muted/40 transition-colors">
                  <AvatarGroup>
                    {guests.slice(0, 4).map((g) => (
                      <Avatar key={g.people_id} className="size-7">
                        {g.photo_sm ? <AvatarImage src={g.photo_sm} alt={g.name ?? ""} /> : null}
                        <AvatarFallback>{(g.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <button type="button" className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors shrink-0">
                    <UserRoundPlus className="size-3.5" />
                  </button>
                  <p className="text-muted-foreground me-1.5 text-xs">Convidados</p>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 space-y-3" align="end">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Convidados</p>
                  <button
                    type="button"
                    onClick={() => { setGuestsOpen(false); if (typePeople.length === 0) { api.get<TypePeople[]>("/type-people").then((r) => setTypePeople(r.data)).catch(() => {}); } setShowCreatePeople(true); }}
                    className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <Input
                  ref={guestInputRef}
                  className="h-8 text-sm"
                  placeholder="Buscar pessoa..."
                  value={guestQuery}
                  onChange={(e) => { setGuestQuery(e.target.value); setGuestHighlight(-1); }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setGuestHighlight((p) => Math.min(p + 1, filteredGuestOptions.length - 1)); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setGuestHighlight((p) => Math.max(p - 1, 0)); }
                    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const idx = guestHighlight >= 0 ? guestHighlight : 0; if (filteredGuestOptions[idx]) { handleAddGuest(filteredGuestOptions[idx]); } }
                    else if (e.key === "Escape") setGuestQuery("");
                  }}
                />
                {guestQuery.length > 0 && filteredGuestOptions.length > 0 && (
                  <div className="border border-border rounded-md max-h-40 overflow-y-auto text-sm mt-1">
                    {filteredGuestOptions.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddGuest(p)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left ${i === guestHighlight ? "bg-accent" : "hover:bg-accent/60"}`}
                      >
                        {p.photo_sm ? (
                          <img src={p.photo_sm} alt={p.name} className="size-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold shrink-0">{p.name.charAt(0)}</span>
                        )}
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                {guestQuery.length > 0 && filteredGuestOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1 mt-1">Nenhum resultado</p>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {guests.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Nenhum convidado.</p>
                  )}
                  {guests.map((g) => (
                    <div key={g.people_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group">
                      {g.photo_sm ? (
                        <img src={g.photo_sm} alt={g.name ?? ""} className="size-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold shrink-0">{(g.name ?? "?").charAt(0)}</span>
                      )}
                      <span className="flex-1 text-xs truncate">{g.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(g.people_id)}
                        className="size-4 rounded flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
            {!editMode ? (
              <Button variant="primary" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="size-3.5 [&_svg]:size-2.5" /> Editar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left panel (edit form) — visível apenas em editMode ── */}
          {editMode && (
            <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-y-auto">
              <form onSubmit={handleSave} className="p-5 flex-1 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ad-title" className="text-xs">Título</Label>
                  <Input
                    id="ad-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pessoa</Label>
                  <div className="relative">
                    <Input
                      className="h-8 text-sm"
                      value={peopleQuery}
                      placeholder="Buscar pessoa..."
                      onChange={(e) => { setPeopleQuery(e.target.value); setPeopleId(undefined); setShowDrop(true); setHighlightedIdx(-1); }}
                      onFocus={() => setShowDrop(true)}
                      onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                      onKeyDown={(e) => {
                        const filtered = people.filter(p => p.name.toLowerCase().includes(peopleQuery.toLowerCase()));
                        if (!showDrop || filtered.length === 0) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIdx(prev => Math.min(prev + 1, filtered.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIdx(prev => Math.max(prev - 1, 0)); }
                        else if (e.key === "Enter" && highlightedIdx >= 0) { e.preventDefault(); const p = filtered[highlightedIdx]; setPeopleId(p.id); setPeopleQuery(p.name); setShowDrop(false); }
                        else if (e.key === "Escape") setShowDrop(false);
                      }}
                    />
                    {showDrop && peopleQuery.length > 0 && (
                      <ul ref={editDropRef} className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-44 overflow-y-auto text-sm">
                        {people.filter(p => p.name.toLowerCase().includes(peopleQuery.toLowerCase())).map((p, i) => (
                          <li key={p.id} onMouseDown={() => { setPeopleId(p.id); setPeopleQuery(p.name); setShowDrop(false); }}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${i === highlightedIdx ? "bg-accent" : "hover:bg-accent/60"}`}>
                            {p.photo_sm ? (
                              <img src={p.photo_sm} alt={p.name} className="size-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold shrink-0">{p.name.charAt(0)}</span>
                            )}
                            {p.name}
                          </li>
                        ))}
                        {people.filter(p => p.name.toLowerCase().includes(peopleQuery.toLowerCase())).length === 0 && (
                          <li className="px-3 py-2 text-muted-foreground">Nenhum resultado</li>
                        )}
                      </ul>
                    )}
                  </div>
                  {peopleId && (
                    <button type="button" className="text-[10px] text-muted-foreground hover:text-destructive" onClick={() => { setPeopleId(undefined); setPeopleQuery(""); }}>
                      Limpar pessoa
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-status" className="text-xs">Status</Label>
                  <Select value={status} onValueChange={setStatus} indicatorPosition="right">
                    <SelectTrigger id="ad-status" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ITEMS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <Badge variant={s.variant} appearance="light" size="sm">{s.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ad-priority" className="text-xs">Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority} indicatorPosition="right">
                    <SelectTrigger id="ad-priority" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_ITEMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">
                            <span className={`size-3 rounded-full ${p.color}`} />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setEditMode(false)} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={saving || !title.trim()}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Right panel — tabs ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Tabs defaultValue="notes" className="flex flex-col flex-1 min-h-0">
              <div className="px-0 py-0 border-b border-border shrink-0">
                <TabsList size="sm" className="pl-4">
                  <TabsTrigger value="notes">
                    <StickyNote />
                    Notas
                    {notes.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{notes.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="contacts">
                    <Phone />
                    Contatos
                    {contacts.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{contacts.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="addresses">
                    <MapPin />
                    Endereço
                    {addresses.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{addresses.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <FileText />
                    Documentos
                    {documents.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{documents.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    <Folder />
                    Arquivos
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {tabsLoading ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <>
                    <TabsContent value="notes" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <NotesTab basePath={`/attendances/${current.id}`} notes={notes} onChange={setNotes} />
                    </TabsContent>
                    <TabsContent value="contacts" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <ContactsTab basePath={`/attendances/${current.id}`} contacts={contacts} typeContacts={typeContacts} onChange={setContacts} />
                    </TabsContent>
                    <TabsContent value="addresses" className="mt-0 flex-1 overflow-hidden">
                      <AddressesTab
                        basePath={`/attendances/${current.id}`}
                        addresses={addresses}
                        typeAddresses={typeAddresses}
                        onChange={setAddresses}
                      />
                    </TabsContent>
                    <TabsContent value="documents" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <DocumentsTab basePath={`/attendances/${current.id}`} documents={documents} typeDocuments={typeDocuments} onChange={setDocuments} />
                    </TabsContent>
                    <TabsContent value="files" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <PeopleFilesTab personId={current.id} basePath={`/files/attendance/${current.id}`} />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <PeopleModal
      open={showCreatePeople}
      person={null}
      typePeople={typePeople}
      typeContacts={[]}
      typeAddresses={[]}
      typeDocuments={[]}
      onClose={() => setShowCreatePeople(false)}
      onSaved={(saved) => {
        const newGuest = { id: 0, people_id: saved.id, name: saved.name, photo_sm: null, active: true };
        setGuests((prev) => [...prev, newGuest]);
        api.post(`/attendances/${current.id}/people`, { people_id: saved.id })
          .then((res) => setGuests((prev) => prev.map((g) => g.people_id === saved.id && g.id === 0 ? res.data : g)))
          .catch(() => setGuests((prev) => prev.filter((g) => !(g.people_id === saved.id && g.id === 0))));
        setShowCreatePeople(false);
      }}
    />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function AttendanceModal({ open, attendance, onClose, onSaved }: AttendanceModalProps) {
  if (!attendance) {
    return (
      <CreateAttendanceModal
        open={open}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <AttendanceDetailModal
      open={open}
      attendance={attendance}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
