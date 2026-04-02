import { useState, useEffect, useRef } from "react";
import {
  ContactsTab, NotesTab, DocumentsTab, AddressesTab,
  ContactItem, AddressItem, DocumentItem, NoteItem,
} from "@/components/common/entity-tabs";
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
import { User, Pencil, Trash2, Plus, X, Check, FileText, MapPin, Phone, StickyNote, Camera, Loader2, ShieldCheck, Folder } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

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
                        basePath={`/people/${currentPerson.id}`}
                        contacts={contacts}
                        typeContacts={typeContacts}
                        onChange={setContacts}
                      />
                    </TabsContent>
                    <TabsContent value="addresses" className="mt-0 flex-1 overflow-hidden">
                      <AddressesTab
                        basePath={`/people/${currentPerson.id}`}
                        addresses={addresses}
                        typeAddresses={typeAddresses}
                        onChange={setAddresses}
                      />
                    </TabsContent>
                    <TabsContent value="documents" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <DocumentsTab
                        basePath={`/people/${currentPerson.id}`}
                        documents={documents}
                        typeDocuments={typeDocuments}
                        onChange={setDocuments}
                      />
                    </TabsContent>
                    <TabsContent value="notes" className="p-5 mt-0 flex-1 overflow-y-auto">
                      <NotesTab
                        basePath={`/people/${currentPerson.id}`}
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
