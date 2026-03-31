import { useState, useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "@/lib/leaflet-icon-fix";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Building2, Phone, MapPin, FileText, StickyNote, Folder, User, Users,
  Plus, X, Check, Trash2, Pencil, LocateFixed, Minus,
} from "lucide-react";
import { PeopleFilesTab } from "@/components/people/people-files-tab";
import { PeopleModal } from "@/components/people/people-modal";
import { formatDate } from "@/lib/helpers";
import api from "@/lib/api";

// ─── Leaflet pin ─────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
}

interface TypeContact {
  id: number;
  name: string;
  mask: string | null;
  active: boolean;
}

interface TypeAddress {
  id: number;
  name: string;
  active: boolean;
}

interface TypeDocument {
  id: number;
  name: string;
  mask: string | null;
  active: boolean;
}

interface ContactItem {
  id: number;
  type_contact_id: number;
  type_contact: { id: number; name: string; mask: string | null } | null;
  value: string;
  order: number;
  active: boolean;
}

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

interface DocumentItem {
  id: number;
  type_document_id: number;
  type_document: { id: number; name: string } | null;
  value: string;
  validity: string | null;
  order: number;
  active: boolean;
}

interface NoteItem {
  id: number;
  value: string;
  order: number;
  active: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

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

// ─── Address map components ───────────────────────────────────────────────────

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

function MapController({ points, focus }: { points: [number, number][]; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) { map.flyTo(focus, 16, { duration: 1 }); }
  }, [focus, map]);
  useEffect(() => {
    if (focus) return;
    if (points.length === 0) { map.setView([-14.235, -51.925], 4); }
    else if (points.length === 1) { map.setView(points[0], 14); }
    else { map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 }); }
  }, [points, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function MapControls() {
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
        <MapControls />
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

// ─── Tab: Contatos ────────────────────────────────────────────────────────────

function ContactsTab({ tenantId, contacts, typeContacts, onChange }: {
  tenantId: number;
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

  const handleTypeChange = (id: string) => { setNewTypeId(id); setNewValue(""); };
  const handleValueChange = (raw: string) => { setNewValue(mask ? applyMask(raw, mask) : raw); };

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const rawValue = mask ? newValue.replace(/\D/g, "") : newValue.trim();
      const res = await api.post<ContactItem>(`/tenants/${tenantId}/contacts`, {
        type_contact_id: Number(newTypeId),
        value: rawValue,
      });
      onChange([...contacts, res.data]);
      setAdding(false);
      setNewTypeId("");
      setNewValue("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tenants/${tenantId}/contacts/${id}`);
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
          <Input className="h-8 text-sm flex-1" placeholder={mask ?? "Valor..."} value={newValue} onChange={(e) => handleValueChange(e.target.value)} autoFocus />
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

// ─── Tab: Endereços ───────────────────────────────────────────────────────────

function AddressesTab({ tenantId, addresses, typeAddresses, onChange }: {
  tenantId: number;
  addresses: AddressItem[];
  typeAddresses: TypeAddress[];
  onChange: (items: AddressItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [locatingId, setLocatingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AddressItem | null>(null);

  const updateForm = (f: Partial<AddressForm>) => setForm((prev) => ({ ...prev, ...f }));

  const geocode = async (logradouro: string, cidade: string, uf: string): Promise<{ lat: number; lng: number } | null> => {
    const q = [logradouro, cidade, uf, "Brazil"].filter(Boolean).join(", ");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, { headers: { "Accept-Language": "pt-BR" } });
      const data = await res.json();
      if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {}
    return null;
  };

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const logradouro = data.logradouro ?? "";
        const cidade = data.localidade ?? "";
        const uf = data.uf ?? "";
        updateForm({ logradouro, bairro: data.bairro ?? "", cidade, uf, ibge: data.ibge ?? "", complemento: data.complemento ?? "" });
        const coords = await geocode(logradouro, cidade, uf);
        if (coords) updateForm({ lat: coords.lat, lng: coords.lng });
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleLocate = async (a: AddressItem) => {
    setLocatingId(a.id);
    try {
      const coords = await geocode(a.logradouro ?? "", a.cidade ?? "", a.uf ?? "");
      if (coords) {
        await api.put(`/tenants/${tenantId}/addresses/${a.id}`, { lat: coords.lat, lng: coords.lng });
        const updated = { ...a, lat: coords.lat, lng: coords.lng };
        onChange(addresses.map((x) => x.id === a.id ? updated : x));
        setSelected(updated);
      }
    } finally {
      setLocatingId(null);
    }
  };

  const handleAdd = async () => {
    if (!form.typeId) return;
    setSaving(true);
    try {
      const res = await api.post<AddressItem>(`/tenants/${tenantId}/addresses`, {
        type_address_id: Number(form.typeId),
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        ibge: form.ibge || null,
        lat: form.lat,
        lng: form.lng,
      });
      onChange([...addresses, res.data]);
      setAdding(false);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tenants/${tenantId}/addresses/${id}`);
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
            <div className="flex flex-col gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); handleLocate(a); }} disabled={locatingId === a.id}>
                    <LocateFixed className={`size-3 ${locatingId === a.id ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Localizar no mapa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>
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
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
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

// ─── Tab: Documentos ──────────────────────────────────────────────────────────

function DocumentsTab({ tenantId, documents, typeDocuments, onChange }: {
  tenantId: number;
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
      const res = await api.post<DocumentItem>(`/tenants/${tenantId}/documents`, {
        type_document_id: Number(newTypeId),
        value: newValue.trim(),
        validity: newValidity || null,
      });
      onChange([...documents, res.data]);
      setAdding(false);
      setNewTypeId("");
      setNewValue("");
      setNewValidity("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tenants/${tenantId}/documents/${id}`);
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
            <Input className="h-8 text-sm flex-1" placeholder={mask ?? "Número do documento..."} value={newValue} onChange={(e) => handleValueChange(e.target.value)} autoFocus />
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
        <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="size-3.5 [&_svg]:size-2.5" /> Adicionar documento
        </Button>
      )}
    </div>
  );
}

// ─── Tab: Notas ───────────────────────────────────────────────────────────────

function NotesTab({ tenantId, notes, onChange }: {
  tenantId: number;
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
      const res = await api.post<NoteItem>(`/tenants/${tenantId}/notes`, { value: newValue.trim() });
      onChange([...notes, res.data]);
      setAdding(false);
      setNewValue("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tenants/${tenantId}/notes/${id}`);
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

// ─── Tab: Pessoas do gabinete ─────────────────────────────────────────────────

interface TenantPerson {
  id: number;
  name: string;
  birth_date?: string | null;
  photo_sm?: string | null;
  type_people?: { id: number; name: string } | null;
  active: boolean;
}

function TenantPeopleTab({ tenantId }: { tenantId: number }) {
  const [people, setPeople] = useState<TenantPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPerson, setEditingPerson] = useState<TenantPerson | null>(null);
  const [typePeople, setTypePeople] = useState<import("@/components/type-people/type-people-data-grid").TypePeople[]>([]);
  const [typeContacts, setTypeContacts] = useState<import("@/components/type-contacts/type-contacts-data-grid").TypeContact[]>([]);
  const [typeAddresses, setTypeAddresses] = useState<import("@/components/type-addresses/type-addresses-data-grid").TypeAddress[]>([]);
  const [typeDocuments, setTypeDocuments] = useState<import("@/components/type-documents/type-documents-data-grid").TypeDocument[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<TenantPerson[]>(`/tenants/${tenantId}/people`),
      api.get("/type-people"),
      api.get("/type-contacts"),
      api.get("/type-addresses"),
      api.get("/type-documents"),
    ]).then(([p, tp, tc, ta, td]) => {
      setPeople(p.data);
      setTypePeople(tp.data);
      setTypeContacts(tc.data);
      setTypeAddresses(ta.data);
      setTypeDocuments(td.data);
    }).finally(() => setLoading(false));
  }, [tenantId]);

  const handleSaved = (saved: TenantPerson) => {
    setPeople(prev => prev.map(p => p.id === saved.id ? { ...p, ...saved } : p));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Carregando...</div>;
  }

  if (people.length === 0) {
    return <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Nenhuma pessoa cadastrada.</div>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-3 font-medium w-[5%]">ID</th>
              <th className="pb-2 pr-3 font-medium">Nome</th>
              <th className="pb-2 pr-3 font-medium w-[20%]">Tipo</th>
              <th className="pb-2 pr-3 font-medium w-[10%] text-center">Status</th>
              <th className="pb-2 font-medium w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-3 text-muted-foreground font-mono text-xs">
                  #{String(p.id).padStart(5, "0")}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {p.photo_sm ? (
                        <img src={p.photo_sm} alt={p.name} className="size-full object-cover" />
                      ) : (
                        <User className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  {p.type_people ? (
                    <Badge variant="secondary" appearance="light" size="sm">{p.type_people.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-center">
                  <Badge variant={p.active ? "success" : "destructive"} appearance="light" size="sm">
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => setEditingPerson(p)}>
                        <Pencil className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PeopleModal
        open={!!editingPerson}
        person={editingPerson as import("@/components/people/people-data-grid").Person | null}
        typePeople={typePeople}
        typeContacts={typeContacts}
        typeAddresses={typeAddresses}
        typeDocuments={typeDocuments}
        onClose={() => setEditingPerson(null)}
        onSaved={(saved) => { handleSaved(saved as TenantPerson); }}
      />
    </>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface GabinetEditModalProps {
  tenant: Tenant | null;
  onClose: () => void;
  onUpdated: (tenant: Tenant) => void;
  existingSlugs: string[];
}

export function GabinetEditModal({ tenant, onClose, onUpdated, existingSlugs }: GabinetEditModalProps) {
  // Dados do gabinete
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tabs polimórficas
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [typeContacts, setTypeContacts] = useState<TypeContact[]>([]);
  const [typeAddresses, setTypeAddresses] = useState<TypeAddress[]>([]);
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    setSlug(tenant.slug);
    setValidUntil(tenant.valid_until);
    setActive(tenant.active);
    setEditMode(false);
    setErrors({});
    setTabsLoading(true);

    Promise.all([
      api.get<TypeContact[]>("/type-contacts"),
      api.get<TypeAddress[]>("/type-addresses"),
      api.get<TypeDocument[]>("/type-documents"),
      api.get<ContactItem[]>(`/tenants/${tenant.id}/contacts`),
      api.get<AddressItem[]>(`/tenants/${tenant.id}/addresses`),
      api.get<DocumentItem[]>(`/tenants/${tenant.id}/documents`),
      api.get<NoteItem[]>(`/tenants/${tenant.id}/notes`),
    ]).then(([tc, ta, td, c, a, d, n]) => {
      setTypeContacts(tc.data);
      setTypeAddresses(ta.data);
      setTypeDocuments(td.data);
      setContacts(c.data);
      setAddresses(a.data);
      setDocuments(d.data);
      setNotes(n.data);
    }).finally(() => setTabsLoading(false));
  }, [tenant]);

  const slugTaken = slug.length > 0 && slug !== tenant?.slug && existingSlugs.includes(slug);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugTaken || !tenant) return;
    setErrors({});
    setSaving(true);
    try {
      const res = await api.put<Tenant>(`/tenants/${tenant.id}`, {
        name, slug, active, valid_until: validUntil,
      });
      onUpdated(res.data);
      setEditMode(false);
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
      setSaving(false);
    }
  };

  const totalItems = contacts.length + addresses.length + documents.length + notes.length;

  if (!tenant) return null;

  return (
    <Dialog open={!!tenant} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Editar Gabinete</DialogTitle>

        {/* ── Sub-header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold leading-none">{name}</h1>
              <Badge variant={active ? "success" : "secondary"} appearance="light" size="md">
                {active ? "Público" : "Oculto"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              ID: <span className="font-mono">#{String(tenant?.id ?? 0).padStart(5, "0")}</span>
              {" "}&bull; <span className="font-mono">{slug}.mapadovoto.com</span>
              {totalItems > 0 && <> &bull; {totalItems} {totalItems === 1 ? "registro" : "registros"}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
            {!editMode ? (
              <Button variant="primary" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="size-3.5 [&_svg]:size-2.5" /> Editar Detalhes
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { setEditMode(false); if (tenant) { setName(tenant.name); setSlug(tenant.slug); setValidUntil(tenant.valid_until); setActive(tenant.active); } }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left panel ── */}
          <div className="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto">
            <div className="p-5 flex flex-col items-center gap-3 border-b border-border">
              <div className="size-24 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="size-10 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-center leading-snug">{name}</p>
            </div>

            <div className="p-5 flex-1">
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ge-name" className="text-xs">Nome</Label>
                    <Input id="ge-name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" autoFocus />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ge-slug" className="text-xs">Subdomínio</Label>
                    <div className="flex items-center">
                      <Input
                        id="ge-slug"
                        value={slug}
                        onChange={(e) => setSlug(toSlug(e.target.value))}
                        className={`h-8 text-xs rounded-r-none font-mono ${slugTaken ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <span className="h-8 px-2 flex items-center border border-l-0 rounded-r-md bg-muted text-muted-foreground text-xs font-mono whitespace-nowrap">.mapadovoto.com</span>
                    </div>
                    {slugTaken && <p className="text-xs text-destructive">Subdomínio em uso.</p>}
                    {!slugTaken && errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ge-valid" className="text-xs">Validade</Label>
                    <Input id="ge-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="h-8 text-sm" />
                    {errors.valid_until && <p className="text-xs text-destructive">{errors.valid_until}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Status</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{active ? "Público" : "Oculto"}</span>
                      <Switch checked={active} onCheckedChange={setActive} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setEditMode(false); if (tenant) { setName(tenant.name); setSlug(tenant.slug); setValidUntil(tenant.valid_until); setActive(tenant.active); } }} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={saving || !name || !slug || !validUntil || slugTaken}>
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Subdomínio</span>
                    <span className="text-xs font-mono font-medium truncate max-w-[120px]" title={`${slug}.mapadovoto.com`}>{slug}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Validade</span>
                    <span className="text-xs font-medium">{validUntil ? formatDate(validUntil) : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={active ? "success" : "secondary"} appearance="light" size="sm">
                      {active ? "Público" : "Oculto"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Tabs
              defaultValue="pessoas"
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="px-0 py-0 border-b border-border shrink-0">
                <TabsList size="sm">
                  <TabsTrigger value="pessoas">
                    <Users />
                    Pessoas
                  </TabsTrigger>
                  <TabsTrigger value="contacts">
                    <Phone />
                    Contatos
                    {contacts.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{contacts.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="addresses">
                    <MapPin />
                    Endereços
                    {addresses.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{addresses.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <FileText />
                    Documentos
                    {documents.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{documents.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    <StickyNote />
                    Notas
                    {notes.length > 0 && <Badge variant="secondary" appearance="light" size="sm">{notes.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    <Folder />
                    Arquivos
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">

                <TabsContent value="pessoas" className="p-5 mt-0 flex-1 overflow-y-auto">
                  {tenant && <TenantPeopleTab tenantId={tenant.id} />}
                </TabsContent>

                {/* Abas polimórficas */}
                <TabsContent value="contacts" className="p-5 mt-0 flex-1 overflow-y-auto">
                  {tabsLoading ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Carregando...</div>
                  ) : (
                    <ContactsTab tenantId={tenant!.id} contacts={contacts} typeContacts={typeContacts} onChange={setContacts} />
                  )}
                </TabsContent>

                <TabsContent value="addresses" className="mt-0 flex-1 overflow-hidden">
                  {tabsLoading ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Carregando...</div>
                  ) : (
                    <AddressesTab tenantId={tenant!.id} addresses={addresses} typeAddresses={typeAddresses} onChange={setAddresses} />
                  )}
                </TabsContent>

                <TabsContent value="documents" className="p-5 mt-0 flex-1 overflow-y-auto">
                  {tabsLoading ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Carregando...</div>
                  ) : (
                    <DocumentsTab tenantId={tenant!.id} documents={documents} typeDocuments={typeDocuments} onChange={setDocuments} />
                  )}
                </TabsContent>

                <TabsContent value="notes" className="p-5 mt-0 flex-1 overflow-y-auto">
                  {tabsLoading ? (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Carregando...</div>
                  ) : (
                    <NotesTab tenantId={tenant!.id} notes={notes} onChange={setNotes} />
                  )}
                </TabsContent>

                <TabsContent value="files" className="p-5 mt-0 flex-1 overflow-y-auto">
                  {tenant && <PeopleFilesTab personId={tenant.id} basePath={`/files/tenants/${tenant.id}`} />}
                </TabsContent>

              </div>
            </Tabs>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
