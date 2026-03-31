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
import { User, Pencil, Trash2, Plus, X, Check, FileText, MapPin, Phone, StickyNote, LocateFixed, Camera, Loader2, Minus, ShieldCheck, Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Field, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import api from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { Person } from "./people-data-grid";
import { TypePeople } from "@/components/type-people/type-people-data-grid";
import { TypeContact } from "@/components/type-contacts/type-contacts-data-grid";
import { TypeAddress } from "@/components/type-addresses/type-addresses-data-grid";
import { TypeDocument } from "@/components/type-documents/type-documents-data-grid";
import { PeopleFilesTab } from "./people-files-tab";
import { BirthDatePicker } from "./birth-date-picker";
import { PhoneInput } from "@/components/reui/phone-input";
import { parsePhoneNumber, formatPhoneNumber } from "react-phone-number-input";
import type { Value as PhoneValue } from "react-phone-number-input";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface PersonUser {
  id: number;
  email: string;
}

interface PermissionItem {
  id: number;
  module: string;
  name_module: string | null;
  action: string;
  name_action: string | null;
  description: string | null;
  allowed: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PeopleModalProps {
  open: boolean;
  person: Person | null;
  typePeople: TypePeople[];
  typeContacts: TypeContact[];
  typeAddresses: TypeAddress[];
  typeDocuments: TypeDocument[];
  onClose: () => void;
  onSaved: (person: Person) => void;
  tenantId?: number;
}

// ─── Create Modal (small) ─────────────────────────────────────────────────────

function CreatePersonModal({
  open,
  typePeople,
  onClose,
  onSaved,
  tenantId,
}: {
  open: boolean;
  typePeople: TypePeople[];
  onClose: () => void;
  onSaved: (person: Person) => void;
  tenantId?: number;
}) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [typePeopleId, setTypePeopleId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName("");
    setBirthDate("");
    setTypePeopleId("");
    setActive(true);
    setErrors({});
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post<Person>("/people", {
        name,
        birth_date: birthDate || null,
        type_people_id: typePeopleId ? Number(typePeopleId) : null,
        active,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      });
      onSaved(res.data);
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Pessoa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-name">Nome</Label>
              <Input
                id="cp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-birth-date">Data de Nascimento</Label>
              <BirthDatePicker
                id="cp-birth-date"
                value={birthDate}
                onChange={setBirthDate}
              />
              {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-type">Tipo de Pessoa</Label>
              <Select value={typePeopleId} onValueChange={setTypePeopleId}>
                <SelectTrigger id="cp-type">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {typePeople.filter((tp) => tp.active).map((tp) => (
                    <SelectItem key={tp.id} value={String(tp.id)}>
                      {tp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type_people_id && (
                <p className="text-xs text-destructive">{errors.type_people_id}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cp-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="cp-active" checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mask helper ─────────────────────────────────────────────────────────────

function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, "");
  // Suporte a múltiplas máscaras separadas por "|" (ex: CPF|CNPJ)
  // Escolhe a máscara cujo número de "9"s melhor encaixa a quantidade de dígitos
  const masks = mask.split("|");
  const selected = masks.reduce((best, m) => {
    const mDigits = (m.match(/9/g) ?? []).length;
    const bDigits = (best.match(/9/g) ?? []).length;
    // Prefere a menor máscara que ainda comporte os dígitos digitados
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

function ContactsTab({
  personId,
  contacts,
  typeContacts,
  onChange,
}: {
  personId: number;
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

  const handleTypeChange = (id: string) => {
    setNewTypeId(id);
    setNewValue("");
  };

  const handleValueChange = (raw: string) => {
    setNewValue(mask ? applyMask(raw, mask) : raw);
  };

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const rawValue = isWhatsApp || mask
        ? newValue.replace(/\D/g, "")
        : newValue.trim();
      const res = await api.post<ContactItem>(`/people/${personId}/contacts`, {
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
    await api.delete(`/people/${personId}/contacts/${id}`);
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
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(c.id)}
              >
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

function MapController({
  points,
  focus,
}: {
  points: [number, number][];
  focus: [number, number] | null;
}) {
  const map = useMap();

  // Ao mudar o foco (seleção/edição) → flyTo
  useEffect(() => {
    if (focus) {
      map.flyTo(focus, 16, { duration: 1 });
    }
  }, [focus, map]);

  // Ao montar (ou quando os pontos mudam sem foco) → fitBounds em todos
  useEffect(() => {
    if (focus) return;
    if (points.length === 0) {
      map.setView([-14.235, -51.925], 4);
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
    }
  }, [points, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function MapControls() {
  const map = useMap();

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control flex flex-col items-center gap-1.5 mb-3 mr-3">
        <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => map.zoomIn()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
          </button>
          <div className="h-px bg-gray-200 mx-2" />
          <button
            onClick={() => map.zoomOut()}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressMap({
  addresses,
  focus,
  onSelect,
}: {
  addresses: AddressItem[];
  focus: [number, number] | null;
  onSelect: (address: AddressItem) => void;
}) {
  const withCoords = addresses.filter((a) => a.lat !== null && a.lng !== null);
  const points = withCoords.map((a) => [a.lat!, a.lng!] as [number, number]);

  return (
    <div className="w-full h-full min-h-0 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[-14.235, -51.925]}
        zoom={4}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapController points={points} focus={focus} />
        <MapControls />
        {withCoords.map((a) => (
          <Marker
            key={a.id}
            position={[a.lat!, a.lng!]}
            icon={PIN_ICON}
            eventHandlers={{ click: () => onSelect(a) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

function AddressFormPanel({
  form,
  onChange,
  onCepBlur,
  cepLoading,
}: {
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
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
              onChange({ cep: raw });
            }}
            onBlur={onCepBlur}
          />
          {cepLoading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">...</span>
          )}
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

function AddressesTab({
  personId,
  addresses,
  typeAddresses,
  onChange,
}: {
  personId: number;
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
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
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
        updateForm({
          logradouro,
          bairro: data.bairro ?? "",
          cidade,
          uf,
          ibge: data.ibge ?? "",
          complemento: data.complemento ?? "",
        });
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
        await api.put(`/people/${personId}/addresses/${a.id}`, { lat: coords.lat, lng: coords.lng });
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
      const res = await api.post<AddressItem>(`/people/${personId}/addresses`, {
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
    await api.delete(`/people/${personId}/addresses/${id}`);
    if (selected?.id === id) setSelected(null);
    onChange(addresses.filter((a) => a.id !== id));
  };

  const formatAddress = (a: AddressItem) =>
    [a.logradouro, a.numero, a.bairro, a.cidade, a.uf].filter(Boolean).join(", ") || "Endereço incompleto";

  // mapa preview: usa selected ou form em andamento
  const focusLat = adding ? form.lat : selected?.lat ?? null;
  const focusLng = adding ? form.lng : selected?.lng ?? null;
  const mapFocus: [number, number] | null =
    focusLat !== null && focusLng !== null ? [focusLat, focusLng] : null;

  return (
    <div className="flex h-full">
      {/* ── Coluna esquerda 1/3 ── */}
      <div className="w-1/3 shrink-0 flex flex-col gap-3 overflow-y-auto p-5 border-r border-border">

        {/* Lista de endereços existentes */}
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={(e) => { e.stopPropagation(); handleLocate(a); }}
                    disabled={locatingId === a.id}
                  >
                    <LocateFixed className={`size-3 ${locatingId === a.id ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Localizar no mapa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}

        {/* Formulário de adição */}
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

      {/* ── Coluna direita 2/3 — mapa ── */}
      <div className="flex-1 min-w-0 p-4">
        <AddressMap addresses={addresses} focus={mapFocus} onSelect={(a) => setSelected(selected?.id === a.id ? null : a)} />
      </div>
    </div>
  );
}

// ─── Tab: Documentos ──────────────────────────────────────────────────────────

function DocumentsTab({
  personId,
  documents,
  typeDocuments,
  onChange,
}: {
  personId: number;
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

  const handleTypeChange = (id: string) => {
    setNewTypeId(id);
    setNewValue("");
  };

  const handleValueChange = (raw: string) => {
    setNewValue(mask ? applyMask(raw, mask) : raw);
  };

  const handleAdd = async () => {
    if (!newTypeId || !newValue.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<DocumentItem>(`/people/${personId}/documents`, {
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
    await api.delete(`/people/${personId}/documents/${id}`);
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
            <span className="text-xs text-muted-foreground shrink-0">
              Validade: {formatDate(d.validity)}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(d.id)}
              >
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

// ─── Tab: Notas ───────────────────────────────────────────────────────────────

function NotesTab({
  personId,
  notes,
  onChange,
}: {
  personId: number;
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
      const res = await api.post<NoteItem>(`/people/${personId}/notes`, {
        value: newValue.trim(),
      });
      onChange([...notes, res.data]);
      setAdding(false);
      setNewValue("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/people/${personId}/notes/${id}`);
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
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => handleDelete(n.id)}
              >
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
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewValue(""); }}>
              Cancelar
            </Button>
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

// ─── Tab: Restrições ──────────────────────────────────────────────────────────

function RestrictionsTab({
  personId,
  permissions,
  onChange,
}: {
  personId: number;
  permissions: PermissionItem[];
  onChange: (items: PermissionItem[]) => void;
}) {
  const [toggling, setToggling] = useState<number | null>(null);
  const [togglingGroup, setTogglingGroup] = useState<string | null>(null);

  const modules = [...new Set(permissions.map((p) => p.module))];

  const handleToggle = async (perm: PermissionItem, allowed: boolean) => {
    setToggling(perm.id);
    try {
      await api.put(`/people/${personId}/permissions/${perm.id}`, { allowed });
      onChange(permissions.map((p) => (p.id === perm.id ? { ...p, allowed } : p)));
    } finally {
      setToggling(null);
    }
  };

  const handleGroupToggle = async (mod: string, allowed: boolean) => {
    const group = permissions.filter((p) => p.module === mod);
    setTogglingGroup(mod);
    try {
      await Promise.all(
        group.map((perm) => api.put(`/people/${personId}/permissions/${perm.id}`, { allowed }))
      );
      onChange(permissions.map((p) => (p.module === mod ? { ...p, allowed } : p)));
    } finally {
      setTogglingGroup(null);
    }
  };

  const groupState = (mod: string): boolean | "indeterminate" => {
    const group = permissions.filter((p) => p.module === mod);
    const allowedCount = group.filter((p) => p.allowed).length;
    if (allowedCount === 0) return false;
    if (allowedCount === group.length) return true;
    return "indeterminate";
  };

  if (permissions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 items-start">
      {modules.map((mod) => {
        const actions = permissions.filter((p) => p.module === mod);
        const moduleName = actions[0]?.name_module ?? mod;
        const state = groupState(mod);

        return (
          <Frame key={mod} spacing="sm">
            <FrameHeader className="flex items-center gap-2 px-3 py-2.5">
              <Checkbox
                checked={state}
                onCheckedChange={(v) => handleGroupToggle(mod, !!v)}
                disabled={togglingGroup === mod}
              />
              <FrameTitle
                className="cursor-pointer select-none text-sm font-semibold"
                onClick={() => handleGroupToggle(mod, state !== true)}
              >
                {moduleName}
              </FrameTitle>
            </FrameHeader>
            <FramePanel className="overflow-hidden p-0!">
              <FieldGroup className="gap-0">
                {actions.map((perm, idx) => (
                  <>
                    {idx > 0 && <Separator key={`sep-${perm.id}`} />}
                    <Field key={perm.id}>
                      <FieldLabel className="px-3 py-2.5 cursor-pointer">
                        <Checkbox
                          checked={perm.allowed}
                          onCheckedChange={(v) => handleToggle(perm, !!v)}
                          disabled={toggling === perm.id}
                        />
                        <FieldTitle>{perm.name_action ?? perm.action}</FieldTitle>
                      </FieldLabel>
                    </Field>
                  </>
                ))}
              </FieldGroup>
            </FramePanel>
          </Frame>
        );
      })}
    </div>
  );
}

// ─── Detail Modal (large) ─────────────────────────────────────────────────────

function PersonDetailModal({
  open,
  person,
  typePeople,
  typeContacts,
  typeAddresses,
  typeDocuments,
  onClose,
  onSaved,
}: {
  open: boolean;
  person: Person;
  typePeople: TypePeople[];
  typeContacts: TypeContact[];
  typeAddresses: TypeAddress[];
  typeDocuments: TypeDocument[];
  onClose: () => void;
  onSaved: (person: Person) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(person.name);
  const [birthDate, setBirthDate] = useState(person.birth_date ?? "");
  const [typePeopleId, setTypePeopleId] = useState<string>(
    person.type_people_id ? String(person.type_people_id) : ""
  );
  const [active, setActive] = useState(person.active);
  const [saving, setSaving] = useState(false);

  const { user, setUser } = useLoginModal();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarLightbox, setAvatarLightbox] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post<{ photo_original: string; photo_md: string; photo_sm: string }>(
        `/people/${currentPerson.id}/avatar`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updated = { ...currentPerson, ...res.data };
      setCurrentPerson(updated);
      onSaved(updated);
      if (user?.people?.id === currentPerson.id) {
        setUser({ ...user, people: { ...user.people, ...res.data } });
      }
    } catch (err) {
      console.error("Erro ao fazer upload do avatar:", err);
      alert("Erro ao fazer upload. Verifique o console.");
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    try {
      await api.delete(`/people/${currentPerson.id}/avatar`);
      const updated = { ...currentPerson, photo_original: null, photo_md: null, photo_sm: null, photo_path: null };
      setCurrentPerson(updated);
      onSaved(updated);
      if (user?.people?.id === currentPerson.id) {
        setUser({ ...user, people: { ...user.people, photo_sm: null, photo_md: null, photo_original: null } });
      }
    } finally {
      setAvatarLoading(false);
    }
  };

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tabsLoading, setTabsLoading] = useState(true);

  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [personUser, setPersonUser] = useState<PersonUser | null>(null);
  const [userFormMode, setUserFormMode] = useState<"idle" | "create" | "edit">("idle");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  const [userSaving, setUserSaving] = useState(false);

  const [currentPerson, setCurrentPerson] = useState<Person>(person);

  useEffect(() => {
    if (!open) return;
    setCurrentPerson(person);
    setName(person.name);
    setBirthDate(person.birth_date ?? "");
    setTypePeopleId(person.type_people_id ? String(person.type_people_id) : "");
    setActive(person.active);
    setEditMode(false);
    setTabsLoading(true);
    setPersonUser(null);
    setUserFormMode("idle");
    setPermissions([]);

    Promise.all([
      api.get<ContactItem[]>(`/people/${person.id}/contacts`),
      api.get<AddressItem[]>(`/people/${person.id}/addresses`),
      api.get<DocumentItem[]>(`/people/${person.id}/documents`),
      api.get<NoteItem[]>(`/people/${person.id}/notes`),
      api.get<PersonUser | null>(`/people/${person.id}/user`),
      api.get<PermissionItem[]>(`/people/${person.id}/permissions`),
    ]).then(([c, a, d, n, u, p]) => {
      setContacts(c.data);
      setAddresses(a.data);
      setDocuments(d.data);
      setNotes(n.data);
      setPersonUser(u.data);
      setPermissions(p.data);
    }).finally(() => setTabsLoading(false));
  }, [open, person]);

  const handleUserSave = async () => {
    setUserSaving(true);
    try {
      if (userFormMode === "create") {
        const res = await api.post<PersonUser>(`/people/${currentPerson.id}/user`, {
          email: userEmail,
          password: userPassword,
          password_confirmation: userPasswordConfirm,
        });
        setPersonUser(res.data);
      } else {
        const body: Record<string, string> = { email: userEmail };
        if (userPassword) {
          body.password = userPassword;
          body.password_confirmation = userPasswordConfirm;
        }
        const res = await api.put<PersonUser>(`/people/${currentPerson.id}/user`, body);
        setPersonUser(res.data);
      }
      setUserFormMode("idle");
      setUserPassword("");
      setUserPasswordConfirm("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? "Erro ao salvar usuário.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put<Person>(`/people/${currentPerson.id}`, {
        name,
        birth_date: birthDate || null,
        type_people_id: typePeopleId ? Number(typePeopleId) : null,
        active,
      });
      setCurrentPerson(res.data);
      onSaved(res.data);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const totalItems = contacts.length + addresses.length + documents.length + notes.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Detalhes da Pessoa</DialogTitle>
        {/* ── Sub-header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold leading-none">{currentPerson.name}</h1>
              <Badge
                variant={currentPerson.active ? "success" : "destructive"}
                appearance="light"
                size="md"
              >
                {currentPerson.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              ID: <span className="font-mono">#{String(currentPerson.id).padStart(5, "0")}</span>
              {currentPerson.type_people && (
                <> &bull; Tipo: <strong>{currentPerson.type_people.name}</strong></>
              )}
              {totalItems > 0 && (
                <> &bull; {totalItems} {totalItems === 1 ? "registro" : "registros"}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {!editMode ? (
              <Button variant="primary" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="size-3.5 [&_svg]:size-2.5" /> Editar Detalhes
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

          {/* ── Left panel ── */}
          <div className="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto">
            {/* Avatar */}
            <div className="p-5 flex flex-col items-center gap-3 border-b border-border">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    if (avatarLoading) return;
                    if (currentPerson.photo_original) setAvatarLightbox(true);
                    else avatarInputRef.current?.click();
                  }}
                  className="size-24 rounded-full bg-muted flex items-center justify-center overflow-hidden relative"
                >
                  {currentPerson.photo_md ? (
                    <img src={currentPerson.photo_md} alt={currentPerson.name} className="size-full object-cover" />
                  ) : (
                    <User className="size-10 text-muted-foreground" />
                  )}
                  <div className={`absolute inset-0 bg-black/40 rounded-full transition-opacity flex items-center justify-center ${avatarLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {avatarLoading ? (
                      <Loader2 className="size-5 text-white animate-spin" />
                    ) : (
                      <Camera className="size-5 text-white" />
                    )}
                  </div>
                </button>
                {currentPerson.photo_md && !avatarLoading && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="absolute -top-0.5 -right-0.5 size-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remover foto</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Lightbox do avatar */}
              {avatarLightbox && currentPerson.photo_original && (
                <div
                  className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
                  onClick={() => setAvatarLightbox(false)}
                >
                  <div className="relative flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={currentPerson.photo_original}
                      alt={currentPerson.name}
                      className="max-w-[80vw] max-h-[75vh] object-contain rounded-xl shadow-2xl"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                        onClick={() => { setAvatarLightbox(false); avatarInputRef.current?.click(); }}
                      >
                        <Camera className="size-3.5 [&_svg]:size-2.5" /> Alterar foto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                        onClick={() => { setAvatarLightbox(false); handleAvatarRemove(); }}
                      >
                        <X className="size-3.5 [&_svg]:size-2.5" /> Remover foto
                      </Button>
                    </div>
                    <button
                      onClick={() => setAvatarLightbox(false)}
                      className="absolute -top-3 -right-3 size-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}
              <p className="text-sm font-semibold text-center leading-snug">{currentPerson.name}</p>
            </div>

            {/* Info / Edit form */}
            <div className="p-5 flex-1">
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ep-name" className="text-xs">Nome</Label>
                    <Input
                      id="ep-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ep-birth-date" className="text-xs">Data de Nascimento</Label>
                    <BirthDatePicker
                      id="ep-birth-date"
                      value={birthDate}
                      onChange={setBirthDate}
                      inputSize="sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ep-type" className="text-xs">Tipo de Pessoa</Label>
                    <Select value={typePeopleId} onValueChange={setTypePeopleId}>
                      <SelectTrigger id="ep-type" className="h-8 text-sm">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {typePeople.filter((tp) => tp.active).map((tp) => (
                          <SelectItem key={tp.id} value={String(tp.id)}>{tp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Status</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                      <Switch checked={active} onCheckedChange={setActive} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setEditMode(false)} disabled={saving}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={saving || !name.trim()}>
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Tipo</span>
                    <span className="text-xs font-medium">{currentPerson.type_people?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Nascimento</span>
                    <span className="text-xs font-medium">
                      {currentPerson.birth_date ? formatDate(currentPerson.birth_date) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge
                      variant={currentPerson.active ? "success" : "destructive"}
                      appearance="light"
                      size="sm"
                    >
                      {currentPerson.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Usuário</span>
                    <div className="flex items-center gap-1.5">
                      {personUser ? (
                        <>
                          <span className="text-xs font-medium truncate max-w-[110px]" title={personUser.email}>{personUser.email}</span>
                          <button
                            type="button"
                            onClick={() => { setUserEmail(personUser.email); setUserPassword(""); setUserPasswordConfirm(""); setUserFormMode("edit"); }}
                            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Pencil className="size-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground">—</span>
                          <button
                            type="button"
                            onClick={() => { setUserEmail(""); setUserPassword(""); setUserPasswordConfirm(""); setUserFormMode("create"); }}
                            className="p-0.5 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Plus className="size-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {userFormMode !== "idle" && (
                    <div className="mt-1 p-3 rounded-lg bg-muted/50 space-y-2.5">
                      <p className="text-xs font-semibold">{userFormMode === "create" ? "Criar acesso" : "Editar acesso"}</p>
                      <div className="space-y-1">
                        <Label className="text-xs">E-mail</Label>
                        <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="h-7 text-xs" autoFocus />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{userFormMode === "create" ? "Senha" : "Nova senha"}</Label>
                        <Input
                          type="password"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          className="h-7 text-xs"
                          placeholder={userFormMode === "edit" ? "Deixe em branco para manter" : ""}
                        />
                      </div>
                      {(userFormMode === "create" || userPassword) && (
                        <div className="space-y-1">
                          <Label className="text-xs">Confirmar senha</Label>
                          <Input type="password" value={userPasswordConfirm} onChange={(e) => setUserPasswordConfirm(e.target.value)} className="h-7 text-xs" />
                        </div>
                      )}
                      <div className="flex gap-1.5 pt-1">
                        <Button type="button" size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setUserFormMode("idle")} disabled={userSaving}>
                          Cancelar
                        </Button>
                        <Button type="button" size="sm" variant="primary" className="flex-1 h-7 text-xs" onClick={handleUserSave} disabled={userSaving}>
                          {userSaving ? <Loader2 className="size-3 animate-spin" /> : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Tabs defaultValue="contacts" className="flex flex-col flex-1 min-h-0">
              <div className="px-0 py-0 border-b border-border shrink-0">
                <TabsList size="sm">
                  <TabsTrigger value="contacts">
                    <Phone />
                    Contatos
                    {contacts.length > 0 && (
                      <Badge variant="secondary" appearance="light" size="sm">{contacts.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="addresses">
                    <MapPin />
                    Endereços
                    {addresses.length > 0 && (
                      <Badge variant="secondary" appearance="light" size="sm">{addresses.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <FileText />
                    Documentos
                    {documents.length > 0 && (
                      <Badge variant="secondary" appearance="light" size="sm">{documents.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    <StickyNote />
                    Notas
                    {notes.length > 0 && (
                      <Badge variant="secondary" appearance="light" size="sm">{notes.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="restrictions">
                    <ShieldCheck />
                    Restrições
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
                    <TabsContent value="contacts" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <ContactsTab
                        personId={currentPerson.id}
                        contacts={contacts}
                        typeContacts={typeContacts}
                        onChange={setContacts}
                      />
                    </TabsContent>
                    <TabsContent value="addresses" className="mt-0 flex-1 overflow-hidden">
                      <AddressesTab
                        personId={currentPerson.id}
                        addresses={addresses}
                        typeAddresses={typeAddresses}
                        onChange={setAddresses}
                      />
                    </TabsContent>
                    <TabsContent value="documents" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <DocumentsTab
                        personId={currentPerson.id}
                        documents={documents}
                        typeDocuments={typeDocuments}
                        onChange={setDocuments}
                      />
                    </TabsContent>
                    <TabsContent value="notes" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <NotesTab
                        personId={currentPerson.id}
                        notes={notes}
                        onChange={setNotes}
                      />
                    </TabsContent>
                    <TabsContent value="restrictions" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <RestrictionsTab
                        personId={currentPerson.id}
                        permissions={permissions}
                        onChange={setPermissions}
                      />
                    </TabsContent>
                    <TabsContent value="files" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <PeopleFilesTab personId={currentPerson.id} />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function PeopleModal({
  open,
  person,
  typePeople,
  typeContacts,
  typeAddresses,
  typeDocuments,
  onClose,
  onSaved,
  tenantId,
}: PeopleModalProps) {
  if (!person) {
    return (
      <CreatePersonModal
        open={open}
        tenantId={tenantId}
        typePeople={typePeople}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <PersonDetailModal
      open={open}
      person={person}
      typePeople={typePeople}
      typeContacts={typeContacts}
      typeAddresses={typeAddresses}
      typeDocuments={typeDocuments}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
