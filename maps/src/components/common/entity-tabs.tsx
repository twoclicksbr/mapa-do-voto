import { useState, useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Plus, X, Check, StickyNote, Minus } from "lucide-react";
import { PhoneInput } from "@/components/reui/phone-input";
import { parsePhoneNumber, formatPhoneNumber } from "react-phone-number-input";
import type { Value as PhoneValue } from "react-phone-number-input";
import api from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { TypeContact } from "@/components/type-contacts/type-contacts-data-grid";
import { TypeAddress } from "@/components/type-addresses/type-addresses-data-grid";
import { TypeDocument } from "@/components/type-documents/type-documents-data-grid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactItem {
  id: number;
  type_contact_id: number;
  type_contact: { id: number; name: string; mask: string | null } | null;
  value: string;
  order: number;
  active: boolean;
}

export interface AddressItem {
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

export interface DocumentItem {
  id: number;
  type_document_id: number;
  type_document: { id: number; name: string } | null;
  value: string;
  validity: string | null;
  order: number;
  active: boolean;
}

export interface NoteItem {
  id: number;
  value: string;
  order: number;
  active: boolean;
  created_at: string;
}

// ─── Mask helper ─────────────────────────────────────────────────────────────

export function applyMask(raw: string, mask: string): string {
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

// ─── Tab: Contatos ────────────────────────────────────────────────────────────

export function ContactsTab({
  basePath,
  contacts,
  typeContacts,
  onChange,
}: {
  basePath: string;
  contacts: ContactItem[];
  typeContacts: TypeContact[];
  onChange: (items: ContactItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTypeId, setNewTypeId] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = typeContacts.find((tc) => String(tc.id) === newTypeId);
  const mask = selectedType?.mask ?? null;
  const isWhatsApp = selectedType?.name?.toLowerCase() === "whatsapp";

  const handleTypeChange = (id: string) => { setNewTypeId(id); setNewValue(""); };
  const handleValueChange = (raw: string) => { setNewValue(mask ? applyMask(raw, mask) : raw); };

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const rawValue = isWhatsApp || mask ? newValue.replace(/\D/g, "") : newValue.trim();
      const res = await api.post<ContactItem>(`${basePath}/contacts`, {
        type_contact_id: Number(newTypeId),
        value: rawValue,
      });
      onChange([...contacts, res.data]);
      setAdding(false);
      setNewTypeId("");
      setNewValue("");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`${basePath}/contacts/${id}`);
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
            {c.type_contact?.name?.toLowerCase() === "whatsapp"
              ? (formatPhoneNumber(`+${c.value}`) || c.value)
              : c.type_contact?.mask
              ? applyMask(c.value, c.type_contact.mask)
              : c.value}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-3.5 [&_svg]:size-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
          </Tooltip>
        </div>
      ))}
      {adding ? (
        <div className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg">
          <Select value={newTypeId} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Tipo..." />
            </SelectTrigger>
            <SelectContent>
              {typeContacts.filter((tc) => tc.active).map((tc) => (
                <SelectItem key={tc.id} value={String(tc.id)}>{tc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isWhatsApp ? (
            <PhoneInput
              className="flex-1"
              placeholder="Número do WhatsApp"
              value={newValue as PhoneValue}
              onChange={(v) => setNewValue(v ?? "")}
            />
          ) : (
            <Input
              className="h-8 text-sm flex-1"
              placeholder={mask ?? "Valor..."}
              value={newValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
              autoFocus
            />
          )}
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

// ─── Tab: Notas ───────────────────────────────────────────────────────────────

export function NotesTab({
  basePath,
  notes,
  onChange,
}: {
  basePath: string;
  notes: NoteItem[];
  onChange: (items: NoteItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<NoteItem>(`${basePath}/notes`, { value: newValue.trim() });
      onChange([...notes, res.data]);
      setAdding(false);
      setNewValue("");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`${basePath}/notes/${id}`);
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => handleDelete(n.id)}>
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

// ─── Tab: Documentos ─────────────────────────────────────────────────────────

export function DocumentsTab({
  basePath,
  documents,
  typeDocuments,
  onChange,
}: {
  basePath: string;
  documents: DocumentItem[];
  typeDocuments: TypeDocument[];
  onChange: (items: DocumentItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newTypeId, setNewTypeId] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newValidity, setNewValidity] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = typeDocuments.find((td) => String(td.id) === newTypeId);
  const mask = selectedType?.mask ?? null;

  const handleTypeChange = (id: string) => { setNewTypeId(id); setNewValue(""); };
  const handleValueChange = (raw: string) => { setNewValue(mask ? applyMask(raw, mask) : raw); };

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<DocumentItem>(`${basePath}/documents`, {
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
    await api.delete(`${basePath}/documents/${id}`);
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
          {d.validity && (
            <span className="text-xs text-muted-foreground shrink-0">Validade: {formatDate(d.validity)}</span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(d.id)}>
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
            <Select value={newTypeId} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Tipo..." />
              </SelectTrigger>
              <SelectContent>
                {typeDocuments.filter((td) => td.active).map((td) => (
                  <SelectItem key={td.id} value={String(td.id)}>{td.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-8 text-sm flex-1"
              placeholder={mask ?? "Número do documento..."}
              value={newValue}
              onChange={(e) => handleValueChange(e.target.value)}
              autoFocus
            />
            <Input
              type="date"
              className="h-8 text-sm w-36"
              value={newValidity}
              onChange={(e) => setNewValidity(e.target.value)}
            />
            <Button size="icon" variant="primary" className="size-8" onClick={handleAdd} disabled={saving || !newTypeId || !newValue.trim()}>
              <Check className="size-3.5 [&_svg]:size-2.5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => { setAdding(false); setNewTypeId(""); setNewValue(""); setNewValidity(""); }}>
              <X className="size-3.5 [&_svg]:size-2.5" />
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-3.5 [&_svg]:size-2.5" /> Adicionar documento
        </Button>
      )}
    </div>
  );
}

// ─── Tab: Endereços ───────────────────────────────────────────────────────────

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

const EMPTY_FORM: AddressForm = {
  typeId: "", cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "", ibge: "", lat: null, lng: null,
};

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

function MapController({ points, focus }: { points: [number, number][]; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) { map.flyTo(focus, 16, { duration: 1 }); return; }
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

function AddressMap({ addresses, focus, onSelect }: {
  addresses: AddressItem[];
  focus: [number, number] | null;
  onSelect: (a: AddressItem) => void;
}) {
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

function AddressFormPanel({ form, onChange, onCepBlur, cepLoading }: {
  form: AddressForm;
  onChange: (f: Partial<AddressForm>) => void;
  onCepBlur: () => void;
  cepLoading: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">CEP</Label>
        <div className="relative">
          <Input
            className="h-8 text-sm pr-8"
            placeholder="00000-000"
            value={form.cep.length > 5 ? form.cep.slice(0, 5) + "-" + form.cep.slice(5) : form.cep}
            onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 8); onChange({ cep: raw }); }}
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

async function geocode(logradouro: string, numero: string, bairro: string, cidade: string, uf: string, cep?: string): Promise<{ lat: number; lng: number } | null> {
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
}

export function AddressesTab({
  basePath,
  addresses,
  typeAddresses,
  onChange,
}: {
  basePath: string;
  addresses: AddressItem[];
  typeAddresses: TypeAddress[];
  onChange: (items: AddressItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [selected, setSelected] = useState<AddressItem | null>(null);

  const updateForm = (f: Partial<AddressForm>) => setForm((prev) => ({ ...prev, ...f }));

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
      }
    } finally { setCepLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.typeId) return;
    setSaving(true);
    try {
      const coords = await geocode(form.logradouro, form.numero, form.bairro, form.cidade, form.uf, form.cep);
      const lat = coords?.lat ?? form.lat;
      const lng = coords?.lng ?? form.lng;
      const res = await api.post<AddressItem>(`${basePath}/addresses`, {
        type_address_id: Number(form.typeId),
        cep: form.cep || null, logradouro: form.logradouro || null,
        numero: form.numero || null, complemento: form.complemento || null,
        bairro: form.bairro || null, cidade: form.cidade || null,
        uf: form.uf || null, ibge: form.ibge || null,
        lat, lng,
      });
      onChange([...addresses, res.data]);
      setAdding(false);
      setForm(EMPTY_FORM);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`${basePath}/addresses/${id}`);
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
      <div className="w-1/3 shrink-0 flex flex-col gap-3 overflow-y-auto p-5 border-r border-border">
        {addresses.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelected(selected?.id === a.id ? null : a)}
            className={`flex items-start gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${selected?.id === a.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"}`}
          >
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" appearance="light" className="text-[10px] mb-1">{a.type_address?.name ?? "—"}</Badge>
              <p className="text-xs font-medium truncate">{formatAddress(a)}</p>
              {a.cep && <p className="text-[10px] text-muted-foreground">{a.cep}</p>}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost"
                  className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
                  <Trash2 className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
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
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }}>
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
      <div className="flex-1 min-w-0 p-4">
        <AddressMap addresses={addresses} focus={mapFocus} onSelect={(a) => setSelected(selected?.id === a.id ? null : a)} />
      </div>
    </div>
  );
}
