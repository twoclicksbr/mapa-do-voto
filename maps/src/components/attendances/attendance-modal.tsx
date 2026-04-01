import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";

const PIN_ICON = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#E63946"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pencil, Trash2, Plus, X, Check, StickyNote, Phone,
  FileText, MapPin, Folder, Minus, LocateFixed, UserRoundPlus,
} from "lucide-react";
import { PeopleFilesTab } from "@/components/people/people-files-tab";
import { PeopleModal } from "@/components/people/people-modal";
import { TypePeople } from "@/components/type-people/type-people-data-grid";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import type { Attendance, AttendancePerson } from "./attendance-data-grid";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteItem {
  id: number;
  value: string;
  order: number;
  created_at: string;
}

interface ContactItem {
  id: number;
  type_contact_id: number;
  type_contact: { id: number; name: string; mask: string | null } | null;
  value: string;
}

interface DocumentItem {
  id: number;
  type_document_id: number;
  type_document: { id: number; name: string; mask: string | null } | null;
  value: string;
  validity: string | null;
}

interface TypeContact  { id: number; name: string; mask: string | null }
interface TypeDocument { id: number; name: string; mask: string | null; validity?: boolean }
interface TypeAddress  { id: number; name: string; active: boolean }

interface AddressItem {
  id: number;
  type_address_id: number;
  type_address: { id: number; name: string } | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ibge: string | null;
  lat: number | null;
  lng: number | null;
  order: number;
  active: boolean;
}

interface AddressForm {
  typeId: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  ibge: string;
  lat: number | null;
  lng: number | null;
}

const EMPTY_ADDR_FORM: AddressForm = {
  typeId: "", cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "", ibge: "", lat: null, lng: null,
};

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

// ─── Mask helper ─────────────────────────────────────────────────────────────

function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, "");
  const masks = mask.split("|");
  const selected = masks.reduce((best, m) => {
    const mDigits = (m.match(/9/g) ?? []).length;
    const bDigits = (best.match(/9/g) ?? []).length;
    if (digits.length <= mDigits && mDigits < bDigits) return m;
    return best;
  }, masks[masks.length - 1]);
  let result = "";
  let di = 0;
  for (let i = 0; i < selected.length && di < digits.length; i++) {
    result += selected[i] === "9" ? digits[di++] : selected[i];
  }
  return result;
}

// ─── Tab: Notas ───────────────────────────────────────────────────────────────

function NotesTab({
  attendanceId,
  notes,
  onChange,
}: {
  attendanceId: number;
  notes: NoteItem[];
  onChange: (items: NoteItem[]) => void;
}) {
  const [adding, setAdding]   = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving]   = useState(false);

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<NoteItem>(`/attendances/${attendanceId}/notes`, { value: newValue.trim() });
      onChange([...notes, res.data]);
      setAdding(false);
      setNewValue("");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/attendances/${attendanceId}/notes/${id}`);
    onChange(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-2">
      {notes.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma nota cadastrada.</p>
      )}
      {notes.map((n) => (
        <div key={n.id} className="flex items-start gap-3 px-4 py-3 border border-border rounded-lg bg-background">
          <StickyNote className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="flex-1 text-sm whitespace-pre-wrap">{n.value}</p>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(n.created_at)}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDelete(n.id)}>
                <Trash2 className="size-3.5 [&_svg]:size-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      ))}
      {adding ? (
        <div className="flex flex-col gap-2 p-3 border border-dashed border-border rounded-lg">
          <textarea
            className="w-full min-h-[80px] text-sm resize-none border border-border rounded-md p-2.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Escreva uma nota..."
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewValue(""); }}>Cancelar</Button>
            <Button size="sm" variant="primary" onClick={handleAdd} disabled={saving || !newValue.trim()}>
              <Check className="size-3.5 [&_svg]:size-2.5" /> Salvar nota
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-3.5 [&_svg]:size-2.5" /> Adicionar nota
        </Button>
      )}
    </div>
  );
}

// ─── Tab: Contatos ────────────────────────────────────────────────────────────

function ContactsTab({
  attendanceId,
  contacts,
  typeContacts,
  onChange,
}: {
  attendanceId: number;
  contacts: ContactItem[];
  typeContacts: TypeContact[];
  onChange: (items: ContactItem[]) => void;
}) {
  const [adding, setAdding]       = useState(false);
  const [newTypeId, setNewTypeId] = useState("");
  const [newValue, setNewValue]   = useState("");
  const [saving, setSaving]       = useState(false);

  const selectedType = typeContacts.find((tc) => String(tc.id) === newTypeId);
  const mask = selectedType?.mask ?? null;

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<ContactItem>(`/attendances/${attendanceId}/contacts`, {
        type_contact_id: Number(newTypeId),
        value: mask ? newValue.replace(/\D/g, "") : newValue.trim(),
      });
      onChange([...contacts, res.data]);
      setAdding(false);
      setNewTypeId("");
      setNewValue("");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/attendances/${attendanceId}/contacts/${id}`);
    onChange(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-2">
      {contacts.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum contato cadastrado.</p>
      )}
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-background">
          <Badge variant="secondary" appearance="light" className="shrink-0 min-w-[90px] justify-center">
            {c.type_contact?.name ?? "—"}
          </Badge>
          <span className="flex-1 text-sm font-medium">
            {c.type_contact?.mask ? applyMask(c.value, c.type_contact.mask) : c.value}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-3.5 [&_svg]:size-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      ))}
      {adding ? (
        <div className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg">
          <Select value={newTypeId} onValueChange={(v) => { setNewTypeId(v); setNewValue(""); }}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tipo..." /></SelectTrigger>
            <SelectContent>
              {typeContacts.map((tc) => <SelectItem key={tc.id} value={String(tc.id)}>{tc.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            className="h-8 text-sm flex-1"
            placeholder={mask ?? "Valor..."}
            value={newValue}
            onChange={(e) => setNewValue(mask ? applyMask(e.target.value, mask) : e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            autoFocus
          />
          <Button size="icon" variant="primary" className="size-8" onClick={handleAdd} disabled={saving || !newTypeId || !newValue.trim()}>
            <Check className="size-3.5 [&_svg]:size-2.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => { setAdding(false); setNewTypeId(""); setNewValue(""); }}>
            <X className="size-3.5 [&_svg]:size-2.5" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-3.5 [&_svg]:size-2.5" /> Adicionar contato
        </Button>
      )}
    </div>
  );
}

// ─── Tab: Endereço ────────────────────────────────────────────────────────────

function MapController({ points, focus }: { points: [number, number][]; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) { map.flyTo(focus, 16, { duration: 1 }); }
  }, [focus, map]);
  useEffect(() => {
    if (focus) return;
    if (points.length === 0) map.setView([-14.235, -51.925], 4);
    else if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
  }, [points, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control flex flex-col items-center gap-1.5 mb-3 mr-3">
        <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button onClick={() => map.zoomIn()} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <Plus size={16} />
          </button>
          <div className="h-px bg-gray-200 mx-2" />
          <button onClick={() => map.zoomOut()} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <Minus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressMap({ addresses, focus, onSelect }: { addresses: AddressItem[]; focus: [number, number] | null; onSelect: (a: AddressItem) => void }) {
  const withCoords = addresses.filter((a) => a.lat !== null && a.lng !== null);
  const points = withCoords.map((a) => [a.lat!, a.lng!] as [number, number]);
  return (
    <div className="w-full h-full min-h-0 rounded-lg overflow-hidden border border-border">
      <MapContainer center={[-14.235, -51.925]} zoom={4} style={{ width: "100%", height: "100%" }} zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapController points={points} focus={focus} />
        <MapZoomControls />
        {withCoords.map((a) => (
          <Marker key={a.id} position={[a.lat!, a.lng!]} icon={PIN_ICON} eventHandlers={{ click: () => onSelect(a) }} />
        ))}
      </MapContainer>
    </div>
  );
}

function AddressFormPanel({ form, onChange, onCepBlur, cepLoading }: { form: AddressForm; onChange: (f: Partial<AddressForm>) => void; onCepBlur: () => void; cepLoading: boolean }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">CEP</Label>
        <div className="relative">
          <Input className="h-8 text-sm pr-8" placeholder="00000-000"
            value={form.cep.length > 5 ? form.cep.slice(0, 5) + "-" + form.cep.slice(5) : form.cep}
            onChange={(e) => onChange({ cep: e.target.value.replace(/\D/g, "").slice(0, 8) })}
            onBlur={onCepBlur}
          />
          {cepLoading && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">...</span>}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Logradouro</Label>
        <Input className="h-8 text-sm" placeholder="Rua, Av..." value={form.logradouro} onChange={(e) => onChange({ logradouro: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <div className="space-y-1 w-24 shrink-0">
          <Label className="text-xs">Número</Label>
          <Input className="h-8 text-sm" placeholder="Nº" value={form.numero} onChange={(e) => onChange({ numero: e.target.value })} />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Complemento</Label>
          <Input className="h-8 text-sm" placeholder="Apto, Sala..." value={form.complemento} onChange={(e) => onChange({ complemento: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Bairro</Label>
        <Input className="h-8 text-sm" value={form.bairro} onChange={(e) => onChange({ bairro: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Cidade</Label>
          <Input className="h-8 text-sm" value={form.cidade} onChange={(e) => onChange({ cidade: e.target.value })} />
        </div>
        <div className="space-y-1 w-16 shrink-0">
          <Label className="text-xs">UF</Label>
          <Input className="h-8 text-sm uppercase" maxLength={2} value={form.uf} onChange={(e) => onChange({ uf: e.target.value.toUpperCase() })} />
        </div>
      </div>
    </div>
  );
}

function AddressesTab({ attendanceId, addresses, typeAddresses, onChange }: {
  attendanceId: number;
  addresses: AddressItem[];
  typeAddresses: TypeAddress[];
  onChange: (items: AddressItem[]) => void;
}) {
  const [adding, setAdding]         = useState(false);
  const [form, setForm]             = useState<AddressForm>(EMPTY_ADDR_FORM);
  const [saving, setSaving]         = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [locatingId, setLocatingId] = useState<number | null>(null);
  const [selected, setSelected]     = useState<AddressItem | null>(null);

  const updateForm = (f: Partial<AddressForm>) => setForm((prev) => ({ ...prev, ...f }));

  const geocode = async (logradouro: string, numero: string, bairro: string, cidade: string, uf: string, cep?: string): Promise<{ lat: number; lng: number } | null> => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    const cleanCep = cep?.replace(/\D/g, "");
    const street = [logradouro, numero].filter(Boolean).join(", ");
    const cityState = [cidade, uf].filter(Boolean).join(" - ");
    const cepFmt = cleanCep ? cleanCep.slice(0, 5) + "-" + cleanCep.slice(5) : "";
    const address = [street + (bairro ? ` - ${bairro}` : ""), cityState, cepFmt].filter(Boolean).join(", ");
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`);
      const data = await res.json();
      if (data.results?.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
    } catch {}
    return null;
  };

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`);
      const data = await res.json();
      if (!data.errors) {
        const logradouro = data.street ?? "";
        const cidade = data.city ?? "";
        const uf = data.state ?? "";
        updateForm({ logradouro, bairro: data.neighborhood ?? "", cidade, uf, ibge: data.ibge ?? "", complemento: "" });
        const coords = await geocode(logradouro, form.numero ?? "", data.neighborhood ?? "", cidade, uf, clean);
        if (coords) updateForm({ lat: coords.lat, lng: coords.lng });
      }
    } finally { setCepLoading(false); }
  };

  const handleLocate = async (a: AddressItem) => {
    setLocatingId(a.id);
    try {
      const coords = await geocode(a.logradouro ?? "", a.numero ?? "", a.bairro ?? "", a.cidade ?? "", a.uf ?? "", a.cep ?? "");
      if (coords) {
        await api.put(`/attendances/${attendanceId}/addresses/${a.id}`, { lat: coords.lat, lng: coords.lng });
        const updated = { ...a, lat: coords.lat, lng: coords.lng };
        onChange(addresses.map((x) => x.id === a.id ? updated : x));
        setSelected(updated);
      }
    } finally { setLocatingId(null); }
  };

  const handleAdd = async () => {
    if (!form.typeId) return;
    setSaving(true);
    try {
      const coords = await geocode(form.logradouro, form.numero, form.bairro, form.cidade, form.uf, form.cep);
      const lat = coords?.lat ?? form.lat;
      const lng = coords?.lng ?? form.lng;

      const res = await api.post<AddressItem>(`/attendances/${attendanceId}/addresses`, {
        type_address_id: Number(form.typeId),
        cep: form.cep || null, logradouro: form.logradouro || null,
        numero: form.numero || null, complemento: form.complemento || null,
        bairro: form.bairro || null, cidade: form.cidade || null,
        uf: form.uf || null, ibge: form.ibge || null,
        lat, lng,
      });
      onChange([...addresses, res.data]);
      setAdding(false);
      setForm(EMPTY_ADDR_FORM);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/attendances/${attendanceId}/addresses/${id}`);
    if (selected?.id === id) setSelected(null);
    onChange(addresses.filter((a) => a.id !== id));
  };


  const formatAddress = (a: AddressItem) =>
    [a.logradouro, a.numero, a.bairro, a.cidade, a.uf].filter(Boolean).join(", ") || "Endereço incompleto";

  const focusLat = adding ? form.lat : selected?.lat ?? null;
  const focusLng = adding ? form.lng : selected?.lng ?? null;
  const mapFocus: [number, number] | null = focusLat !== null && focusLng !== null ? [focusLat, focusLng] : null;

  return (
    <div className="flex h-full">
      {/* ── Coluna esquerda 1/3 ── */}
      <div className="w-1/3 shrink-0 flex flex-col gap-3 overflow-y-auto p-5 border-r border-border">
        {addresses.map((a) => (
          <div key={a.id} onClick={() => setSelected(selected?.id === a.id ? null : a)}
            className={`flex items-start gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${selected?.id === a.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"}`}
          >
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" appearance="light" className="text-[10px] mb-1">{a.type_address?.name ?? "—"}</Badge>
              <p className="text-xs font-medium truncate">{formatAddress(a)}</p>
              {a.cep && <p className="text-[10px] text-muted-foreground">{a.cep}</p>}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
                    <Trash2 className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}

        {adding ? (
          <div className="border border-dashed border-border rounded-lg p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Endereço</Label>
              <Select value={form.typeId} onValueChange={(v) => updateForm({ typeId: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {typeAddresses.filter((ta) => ta.active).map((ta) => (
                    <SelectItem key={ta.id} value={String(ta.id)}>{ta.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AddressFormPanel form={form} onChange={updateForm} onCepBlur={() => fetchCep(form.cep)} cepLoading={cepLoading} />
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="primary" className="flex-1" onClick={handleAdd} disabled={saving || !form.typeId}>
                <Check className="size-3.5 [&_svg]:size-2.5" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm(EMPTY_ADDR_FORM); }}>
                <X className="size-3.5 [&_svg]:size-2.5" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
            <Plus className="size-3.5 [&_svg]:size-2.5" /> Adicionar endereço
          </Button>
        )}

        {addresses.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhum endereço cadastrado.</p>
        )}
      </div>

      {/* ── Coluna direita 2/3 — mapa ── */}
      <div className="flex-1 min-w-0 p-4">
        <AddressMap addresses={addresses} focus={mapFocus} onSelect={(a) => setSelected(selected?.id === a.id ? null : a)} />
      </div>
    </div>
  );
}

// ─── Tab: Documentos ──────────────────────────────────────────────────────────

function DocumentsTab({
  attendanceId,
  documents,
  typeDocuments,
  onChange,
}: {
  attendanceId: number;
  documents: DocumentItem[];
  typeDocuments: TypeDocument[];
  onChange: (items: DocumentItem[]) => void;
}) {
  const [adding, setAdding]             = useState(false);
  const [newTypeId, setNewTypeId]       = useState("");
  const [newValue, setNewValue]         = useState("");
  const [newValidity, setNewValidity]   = useState("");
  const [saving, setSaving]             = useState(false);

  const selectedType = typeDocuments.find((td) => String(td.id) === newTypeId);
  const mask = selectedType?.mask ?? null;

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<DocumentItem>(`/attendances/${attendanceId}/documents`, {
        type_document_id: Number(newTypeId),
        value: newValue.trim(),
        validity: newValidity || null,
      });
      onChange([...documents, res.data]);
      setAdding(false);
      setNewTypeId("");
      setNewValue("");
      setNewValidity("");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/attendances/${attendanceId}/documents/${id}`);
    onChange(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-2">
      {documents.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum documento cadastrado.</p>
      )}
      {documents.map((d) => (
        <div key={d.id} className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-background">
          <Badge variant="secondary" appearance="light" className="shrink-0 min-w-[90px] justify-center">
            {d.type_document?.name ?? "—"}
          </Badge>
          <span className="flex-1 text-sm font-medium">{d.value}</span>
          {d.validity && <span className="text-xs text-muted-foreground shrink-0">Validade: {formatDate(d.validity)}</span>}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(d.id)}>
                <Trash2 className="size-3.5 [&_svg]:size-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      ))}
      {adding ? (
        <div className="flex flex-col gap-2 p-3 border border-dashed border-border rounded-lg">
          <div className="flex items-center gap-2">
            <Select value={newTypeId} onValueChange={(v) => { setNewTypeId(v); setNewValue(""); }}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tipo..." /></SelectTrigger>
              <SelectContent>
                {typeDocuments.map((td) => <SelectItem key={td.id} value={String(td.id)}>{td.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              className="h-8 text-sm flex-1"
              placeholder={mask ?? "Número do documento..."}
              value={newValue}
              onChange={(e) => setNewValue(mask ? applyMask(e.target.value, mask) : e.target.value)}
              autoFocus
            />
            <Input type="date" className="h-8 text-sm w-36" value={newValidity} onChange={(e) => setNewValidity(e.target.value)} />
            <Button size="icon" variant="primary" className="size-8" onClick={handleAdd} disabled={saving || !newTypeId || !newValue.trim()}>
              <Check className="size-3.5 [&_svg]:size-2.5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => { setAdding(false); setNewTypeId(""); setNewValue(""); setNewValidity(""); }}>
              <X className="size-3.5 [&_svg]:size-2.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setDocAdding(true)}>
          <Plus className="size-3.5 [&_svg]:size-2.5" /> Adicionar documento
        </Button>
      )}
    </div>
  );

  function setDocAdding(v: boolean) { setAdding(v); }
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
              <Label>Pessoa</Label>
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
              <Select value={status} onValueChange={setStatus}>
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
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="ca-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_ITEMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${p.color}`} />
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
                  <span className={`size-2 rounded-full ${currentPriority.color}`} />
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
                  <Select value={status} onValueChange={setStatus}>
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
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="ad-priority" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_ITEMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${p.color}`} />
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
                      <NotesTab attendanceId={current.id} notes={notes} onChange={setNotes} />
                    </TabsContent>
                    <TabsContent value="contacts" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <ContactsTab attendanceId={current.id} contacts={contacts} typeContacts={typeContacts} onChange={setContacts} />
                    </TabsContent>
                    <TabsContent value="addresses" className="mt-0 flex-1 overflow-hidden">
                      <AddressesTab
                        attendanceId={current.id}
                        addresses={addresses}
                        typeAddresses={typeAddresses}
                        onChange={setAddresses}
                      />
                    </TabsContent>
                    <TabsContent value="documents" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <DocumentsTab attendanceId={current.id} documents={documents} typeDocuments={typeDocuments} onChange={setDocuments} />
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
