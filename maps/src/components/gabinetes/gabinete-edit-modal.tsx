import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
}

interface TypePeople {
  id: number;
  name: string;
}

interface Person {
  id: number;
  type_people_id: number;
  name: string;
  active: boolean;
}

interface GabinetEditModalProps {
  tenant: Tenant | null;
  onClose: () => void;
  onUpdated: (tenant: Tenant) => void;
  existingSlugs: string[];
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

export function GabinetEditModal({ tenant, onClose, onUpdated, existingSlugs }: GabinetEditModalProps) {
  // Aba Dados
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Aba Pessoa
  const [person, setPerson] = useState<Person | null>(null);
  const [typePeople, setTypePeople] = useState<TypePeople[]>([]);
  const [personLoaded, setPersonLoaded] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personTypeId, setPersonTypeId] = useState("");
  const [personActive, setPersonActive] = useState(true);
  const [personLoading, setPersonLoading] = useState(false);
  const [personErrors, setPersonErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    setSlug(tenant.slug);
    setValidUntil(tenant.valid_until);
    setActive(tenant.active);
    setErrors({});
    setPerson(null);
    setPersonLoaded(false);
    setPersonName("");
    setPersonTypeId("");
    setPersonActive(true);
    setPersonErrors({});
  }, [tenant]);

  const loadPerson = () => {
    if (personLoaded || !tenant) return;
    setPersonLoaded(true);
    api.get(`/tenants/${tenant.id}/person`).then((res) => {
      const data = res.data;
      setTypePeople(data.type_people ?? []);
      setPerson(data.person ?? null);
    });
  };

  const slugTaken = slug.length > 0 && slug !== tenant?.slug && existingSlugs.includes(slug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugTaken || !tenant) return;
    setErrors({});
    setLoading(true);
    try {
      const res = await api.put<Tenant>(`/tenants/${tenant.id}`, {
        name, slug, active, valid_until: validUntil,
      });
      onUpdated(res.data);
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

  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setPersonErrors({});
    setPersonLoading(true);
    try {
      const res = await api.post<Person>(`/tenants/${tenant.id}/person`, {
        name: personName,
        type_people_id: Number(personTypeId),
        active: personActive,
      });
      setPerson(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const apiErrors = axiosErr?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(apiErrors)) {
          flat[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setPersonErrors(flat);
      }
    } finally {
      setPersonLoading(false);
    }
  };

  return (
    <Dialog open={!!tenant} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Gabinete</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <Tabs defaultValue="dados" className="w-full" onValueChange={(v) => { if (v === "pessoa") loadPerson(); }}>
            <TabsList variant="line" size="xs" className="w-full mb-4">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="pessoa">Pessoa</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="obs">Obs</TabsTrigger>
              <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
            </TabsList>

            {/* ABA DADOS */}
            <TabsContent value="dados">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Político" autoFocus />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-slug">Subdomínio</Label>
                  <div className="flex items-center gap-0">
                    <Input
                      id="edit-slug"
                      value={slug}
                      onChange={(e) => setSlug(toSlug(e.target.value))}
                      placeholder="nomepolitico"
                      className={`rounded-r-none font-mono text-sm ${slugTaken ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    <span className="h-9 px-3 flex items-center border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm font-mono whitespace-nowrap">
                      .mapadovoto.com
                    </span>
                  </div>
                  {slugTaken && <p className="text-xs text-destructive">Este subdomínio já está em uso.</p>}
                  {!slugTaken && errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-valid_until">Validade</Label>
                  <Input id="edit-valid_until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                  {errors.valid_until && <p className="text-xs text-destructive">{errors.valid_until}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-active">Status</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{active ? "Público" : "Oculto"}</span>
                    <Switch id="edit-active" checked={active} onCheckedChange={setActive} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                  <Button type="submit" variant="primary" disabled={loading || !name || !slug || !validUntil || slugTaken}>
                    {loading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ABA PESSOA */}
            <TabsContent value="pessoa">
              {!personLoaded ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
              ) : person ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input value={person.name} readOnly className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Input value={typePeople.find((t) => t.id === person.type_people_id)?.name ?? ""} readOnly className="bg-muted cursor-default" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Status</Label>
                    <span className="text-sm text-muted-foreground">{person.active ? "Ativo" : "Inativo"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Para editar os dados da pessoa, acesse o módulo Pessoas.</p>
                </div>
              ) : (
                <form onSubmit={handlePersonSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="person-name">Nome</Label>
                    <Input id="person-name" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Nome completo" autoFocus />
                    {personErrors.name && <p className="text-xs text-destructive">{personErrors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="person-type">Tipo</Label>
                    <Select value={personTypeId} onValueChange={setPersonTypeId}>
                      <SelectTrigger id="person-type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {typePeople.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {personErrors.type_people_id && <p className="text-xs text-destructive">{personErrors.type_people_id}</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="person-active">Status</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{personActive ? "Ativo" : "Inativo"}</span>
                      <Switch id="person-active" checked={personActive} onCheckedChange={setPersonActive} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" variant="primary" disabled={personLoading || !personName || !personTypeId}>
                      {personLoading ? "Salvando..." : "Cadastrar Pessoa"}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            {["contato", "endereco", "documentos", "obs", "arquivos"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Em breve</div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
