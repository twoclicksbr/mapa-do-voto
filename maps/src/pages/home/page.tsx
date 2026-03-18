import { useRef, useState, useEffect } from "react";
import * as L from "leaflet";
import { LoginModal } from "@/components/auth/login-modal";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { Toolbar, ToolbarHeading, ToolbarActions } from "@/components/layouts/layout-33/components/toolbar";
import { Button } from "@/components/ui/button";
import { Columns2, ChevronDown, Search, Plus, MousePointerClick, MapPin, MapPinned, Building2, Settings } from "lucide-react";
import { MapaDoVotoMap } from "@/components/map/mapa-do-voto-map";
import { Navbar } from "@/components/layouts/layout-33/components/navbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { formatRecordCount } from "@/lib/helpers";
import { useActiveTab } from "@/components/layout/active-tab-context";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { GabinetesDataGrid } from "@/components/gabinetes/gabinetes-data-grid";
import { GabinetCreateModal } from "@/components/gabinetes/gabinete-create-modal";
import { GabinetEditModal } from "@/components/gabinetes/gabinete-edit-modal";
import { AppMegaMenu } from "@/components/common/app-mega-menu";
import { TypePeopleDataGrid, TypePeople } from "@/components/type-people/type-people-data-grid";
import { TypePeopleModal } from "@/components/type-people/type-people-modal";
import { TypeContactsDataGrid, TypeContact } from "@/components/type-contacts/type-contacts-data-grid";
import { TypeContactsModal } from "@/components/type-contacts/type-contacts-modal";
import { TypeAddressesDataGrid, TypeAddress } from "@/components/type-addresses/type-addresses-data-grid";
import { TypeAddressesModal } from "@/components/type-addresses/type-addresses-modal";
import { TypeDocumentsDataGrid, TypeDocument } from "@/components/type-documents/type-documents-data-grid";
import { TypeDocumentsModal } from "@/components/type-documents/type-documents-modal";
import { PeopleDataGrid, Person } from "@/components/people/people-data-grid";
import { PeopleModal } from "@/components/people/people-modal";

function getTenantName(): string {
  const parts = window.location.hostname.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  }
  return 'Overview';
}

function getBaseDomain(): string {
  const parts = window.location.hostname.split('.');
  if (parts.length >= 3) return parts.slice(1).join('.');
  return window.location.hostname;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
}

export function HomePage() {
  const { isMobile } = useLayout();
  const { activeTab, setActiveTab } = useActiveTab();
  const { loggedIn } = useLoginModal();
  const [isSplit, setIsSplit] = useState(false);
  const tenantName = getTenantName();
  const isMaster = tenantName.toLowerCase() === 'master';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsSelected, setTenantsSelected] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [settingsSection, setSettingsSectionState] = useState<string>(
    () => localStorage.getItem('mapadovoto:settingsSection') ?? ''
  );
  const setSettingsSection = (section: string) => {
    localStorage.setItem('mapadovoto:settingsSection', section);
    setSettingsSectionState(section);
  };

  const [typePeople, setTypePeople] = useState<TypePeople[]>([]);
  const [typePeopleLoading, setTypePeopleLoading] = useState(false);
  const [typePeopleSelected, setTypePeopleSelected] = useState(0);
  const [typePeopleModalOpen, setTypePeopleModalOpen] = useState(false);
  const [editingTypePeople, setEditingTypePeople] = useState<TypePeople | null>(null);

  const [typeContacts, setTypeContacts] = useState<TypeContact[]>([]);
  const [typeContactsLoading, setTypeContactsLoading] = useState(false);
  const [typeContactsSelected, setTypeContactsSelected] = useState(0);
  const [typeContactsModalOpen, setTypeContactsModalOpen] = useState(false);
  const [editingTypeContact, setEditingTypeContact] = useState<TypeContact | null>(null);

  const [typeAddresses, setTypeAddresses] = useState<TypeAddress[]>([]);
  const [typeAddressesLoading, setTypeAddressesLoading] = useState(false);
  const [typeAddressesSelected, setTypeAddressesSelected] = useState(0);
  const [typeAddressesModalOpen, setTypeAddressesModalOpen] = useState(false);
  const [editingTypeAddress, setEditingTypeAddress] = useState<TypeAddress | null>(null);

  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [typeDocumentsLoading, setTypeDocumentsLoading] = useState(false);
  const [typeDocumentsSelected, setTypeDocumentsSelected] = useState(0);
  const [typeDocumentsModalOpen, setTypeDocumentsModalOpen] = useState(false);
  const [editingTypeDocument, setEditingTypeDocument] = useState<TypeDocument | null>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleSelected, setPeopleSelected] = useState(0);
  const [peopleModalOpen, setPeopleModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (!isMaster) return;
    setTenantsLoading(true);
    api.get<Tenant[]>('/tenants')
      .then(res => setTenants(res.data))
      .finally(() => setTenantsLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypePeopleLoading(true);
    api.get<TypePeople[]>('/type-people')
      .then(res => setTypePeople(res.data))
      .finally(() => setTypePeopleLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypeContactsLoading(true);
    api.get<TypeContact[]>('/type-contacts')
      .then(res => setTypeContacts(res.data))
      .finally(() => setTypeContactsLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypeAddressesLoading(true);
    api.get<TypeAddress[]>('/type-addresses')
      .then(res => setTypeAddresses(res.data))
      .finally(() => setTypeAddressesLoading(false));
  }, [isMaster, loggedIn]);

  useEffect(() => {
    if (!isMaster || !loggedIn) return;
    setTypeDocumentsLoading(true);
    api.get<TypeDocument[]>('/type-documents')
      .then(res => setTypeDocuments(res.data))
      .finally(() => setTypeDocumentsLoading(false));
  }, [isMaster, loggedIn]);

  const handleTypePeopleReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-people/${id}`, { order: newOrder });
    const res = await api.get<TypePeople[]>('/type-people');
    setTypePeople(res.data);
  };

  const handleTypePeopleDelete = async (id: number) => {
    await api.delete(`/type-people/${id}`);
    setTypePeople(prev => prev.filter(tp => tp.id !== id));
  };

  const handleTypeContactsReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-contacts/${id}`, { order: newOrder });
    const res = await api.get<TypeContact[]>('/type-contacts');
    setTypeContacts(res.data);
  };

  const handleTypeContactsDelete = async (id: number) => {
    await api.delete(`/type-contacts/${id}`);
    setTypeContacts(prev => prev.filter(tc => tc.id !== id));
  };

  const handleTypeAddressesReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-addresses/${id}`, { order: newOrder });
    const res = await api.get<TypeAddress[]>('/type-addresses');
    setTypeAddresses(res.data);
  };

  const handleTypeAddressesDelete = async (id: number) => {
    await api.delete(`/type-addresses/${id}`);
    setTypeAddresses(prev => prev.filter(ta => ta.id !== id));
  };

  const handleTypeDocumentsReorder = async (id: number, newOrder: number) => {
    await api.put(`/type-documents/${id}`, { order: newOrder });
    const res = await api.get<TypeDocument[]>('/type-documents');
    setTypeDocuments(res.data);
  };

  const handleTypeDocumentsDelete = async (id: number) => {
    await api.delete(`/type-documents/${id}`);
    setTypeDocuments(prev => prev.filter(td => td.id !== id));
  };

  useEffect(() => {
    if (!loggedIn) return;
    setPeopleLoading(true);
    api.get<Person[]>('/people')
      .then(res => setPeople(res.data))
      .finally(() => setPeopleLoading(false));
  }, [loggedIn]);

  const handlePeopleDelete = async (id: number) => {
    await api.delete(`/people/${id}`);
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const mapRef1 = useRef<L.Map | null>(null);
  const mapRef2 = useRef<L.Map | null>(null);
  const [cityBounds, setCityBounds] = useState<L.LatLngBounds | null>(null);

  const handleSplitToggle = () => {
    setIsSplit((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (next) {
          mapRef1.current?.invalidateSize();
          mapRef2.current?.invalidateSize();
          if (cityBounds) {
            mapRef1.current?.fitBounds(cityBounds, { padding: [40, 40], animate: false });
            mapRef2.current?.fitBounds(cityBounds, { padding: [40, 40], animate: false });
          }
        } else {
          mapRef1.current?.invalidateSize();
          if (cityBounds) {
            mapRef1.current?.fitBounds(cityBounds, { padding: [40, 40], animate: true });
          }
        }
      }, 100);
      return next;
    });
  };

  const getMap2InitialView = () => {
    if (mapRef1.current) {
      return {
        center: [mapRef1.current.getCenter().lat, mapRef1.current.getCenter().lng] as L.LatLngTuple,
        zoom: mapRef1.current.getZoom(),
      };
    }
    return undefined;
  };

  return (
    <div className="container-fluid flex flex-col h-full">
      <LoginModal />
      <GabinetCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(tenant) => { setTenants((prev) => [...prev, tenant]); setEditingTenant(tenant); }}
        existingSlugs={tenants.map((t) => t.slug)}
      />
      <GabinetEditModal
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onUpdated={(updated) => setTenants((prev) => prev.map((t) => t.id === updated.id ? updated : t))}
        existingSlugs={tenants.map((t) => t.slug)}
      />
      <TypePeopleModal
        open={typePeopleModalOpen || !!editingTypePeople}
        typePeople={editingTypePeople}
        onClose={() => { setTypePeopleModalOpen(false); setEditingTypePeople(null); }}
        onSaved={(saved) => {
          setTypePeople(prev => {
            const idx = prev.findIndex(tp => tp.id === saved.id);
            return idx >= 0 ? prev.map(tp => tp.id === saved.id ? saved : tp) : [...prev, saved];
          });
          setTypePeopleModalOpen(false);
          setEditingTypePeople(null);
        }}
      />
      <TypeContactsModal
        open={typeContactsModalOpen || !!editingTypeContact}
        typeContact={editingTypeContact}
        onClose={() => { setTypeContactsModalOpen(false); setEditingTypeContact(null); }}
        onSaved={(saved) => {
          setTypeContacts(prev => {
            const idx = prev.findIndex(tc => tc.id === saved.id);
            return idx >= 0 ? prev.map(tc => tc.id === saved.id ? saved : tc) : [...prev, saved];
          });
          setTypeContactsModalOpen(false);
          setEditingTypeContact(null);
        }}
      />
      <TypeAddressesModal
        open={typeAddressesModalOpen || !!editingTypeAddress}
        typeAddress={editingTypeAddress}
        onClose={() => { setTypeAddressesModalOpen(false); setEditingTypeAddress(null); }}
        onSaved={(saved) => {
          setTypeAddresses(prev => {
            const idx = prev.findIndex(ta => ta.id === saved.id);
            return idx >= 0 ? prev.map(ta => ta.id === saved.id ? saved : ta) : [...prev, saved];
          });
          setTypeAddressesModalOpen(false);
          setEditingTypeAddress(null);
        }}
      />
      <TypeDocumentsModal
        open={typeDocumentsModalOpen || !!editingTypeDocument}
        typeDocument={editingTypeDocument}
        onClose={() => { setTypeDocumentsModalOpen(false); setEditingTypeDocument(null); }}
        onSaved={(saved) => {
          setTypeDocuments(prev => {
            const idx = prev.findIndex(td => td.id === saved.id);
            return idx >= 0 ? prev.map(td => td.id === saved.id ? saved : td) : [...prev, saved];
          });
          setTypeDocumentsModalOpen(false);
          setEditingTypeDocument(null);
        }}
      />
      <PeopleModal
        open={peopleModalOpen || !!editingPerson}
        person={editingPerson}
        typePeople={typePeople}
        typeContacts={typeContacts}
        typeAddresses={typeAddresses}
        typeDocuments={typeDocuments}
        onClose={() => { setPeopleModalOpen(false); setEditingPerson(null); }}
        onSaved={(saved) => {
          setPeople(prev => {
            const idx = prev.findIndex(p => p.id === saved.id);
            return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [...prev, saved];
          });
          if (!editingPerson) {
            setPeopleModalOpen(false);
          }
        }}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <Toolbar>
          <div className="flex items-center gap-3">
            <img src="/media/logo/logo.svg" alt="Mapa do Voto" className="h-7 w-auto" />
            <span className="text-lg text-foreground"><strong>Mapa</strong>do<strong>Voto</strong></span>
            <ToolbarHeading>
              <div className="flex items-center gap-2">
                {isMaster ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex items-center gap-1 text-sm font-medium text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors">
                        Gabinete: {tenantName} <ChevronDown className="size-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {tenants.map(t => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => {
                            const base = getBaseDomain();
                            window.location.href = `${window.location.protocol}//${t.slug}.${base}`;
                          }}
                        >
                          {t.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-sm font-medium text-foreground px-2">
                    Gabinete: {tenantName}
                  </span>
                )}
                <TabsList size="xs">
                  <TabsTrigger value="overview">Mapa</TabsTrigger>
                  <TabsTrigger value="activity">Atendimentos</TabsTrigger>
                  <TabsTrigger value="metrics">Agenda</TabsTrigger>
                  <TabsTrigger value="reports">Alianças</TabsTrigger>
                  <TabsTrigger value="alerts">Finanças</TabsTrigger>
                  <TabsTrigger value="settings"><Settings className="size-3.5" />Configurações</TabsTrigger>
                </TabsList>
              </div>
            </ToolbarHeading>
          </div>
          {!isMobile && (
            <ToolbarActions>
              {isMaster && (
                <Button
                  mode="icon"
                  variant={isSplit ? "primary" : "dim"}
                  onClick={handleSplitToggle}
                  title="Split view"
                >
                  <Columns2 />
                </Button>
              )}
              <Navbar />
            </ToolbarActions>
          )}
        </Toolbar>

        {isMaster && (
          <TabsContent value="gabinetes" className="flex-1 min-h-0 mt-0 flex flex-col">
            <AppMegaMenu />
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="size-5 text-muted-foreground" />Gabinetes <Badge variant="success" appearance="light" size="md">{formatRecordCount(tenants.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie os gabinetes da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {tenantsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({tenantsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="success" appearance="light" size="sm">Publicar</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="destructive" appearance="light" size="sm">Ocultar</Badge>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <GabinetesDataGrid tenants={tenants} isLoading={tenantsLoading} onSelectionChange={setTenantsSelected} onEdit={setEditingTenant} />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span> Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="overview" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex flex-row">
            <div className={isSplit ? "w-1/2 h-full" : "w-full h-full"}>
              <MapaDoVotoMap
                mapRef={mapRef1}
                syncRef={isSplit ? mapRef2 : undefined}
                onCityBoundsReady={setCityBounds}
                cityBounds={cityBounds}
              />
            </div>
            {isSplit && (
              <div className="w-1/2 h-full border-l border-border">
                <MapaDoVotoMap
                  key="map2"
                  mapRef={mapRef2}
                  syncRef={mapRef1}
                  initialView={getMap2InitialView()}
                  cityBounds={cityBounds}
                  isCompare={true}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Atendimentos — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Agenda — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Alianças — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="pessoas" className="flex-1 min-h-0 mt-0 flex flex-col">
          <AppMegaMenu />
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">Pessoas <Badge variant="success" appearance="light" size="md">{formatRecordCount(people.length)}</Badge></h2>
                <p className="text-sm text-muted-foreground">Gerencie as pessoas da plataforma</p>
              </div>
              <div className="flex items-center gap-2">
                {peopleSelected > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                        Ações em massa ({peopleSelected}) <ChevronDown className="size-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                          <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button variant="outline" size="sm">
                      <Search className="size-4 mr-2" />
                      Pesquisar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setPeopleModalOpen(true)}>
                      <Plus className="size-4 mr-2" />
                      Novo Registro
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <PeopleDataGrid
                people={people}
                isLoading={peopleLoading}
                onSelectionChange={setPeopleSelected}
                onEdit={(p) => setEditingPerson(p)}
                onDelete={handlePeopleDelete}
              />
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
              <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
              <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Finanças — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 mt-0 flex flex-col">
          <AppMegaMenu onNavigate={setSettingsSection} activeSection={settingsSection} />
          {settingsSection === 'type-people' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">Tipo de Pessoas <Badge variant="success" appearance="light" size="md">{formatRecordCount(typePeople.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie os tipos de pessoa da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {typePeopleSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typePeopleSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypePeopleModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <TypePeopleDataGrid
                  typePeople={typePeople}
                  isLoading={typePeopleLoading}
                  onSelectionChange={setTypePeopleSelected}
                  onEdit={(tp) => setEditingTypePeople(tp)}
                  onDelete={handleTypePeopleDelete}
                  onReorder={handleTypePeopleReorder}
                />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          ) : settingsSection === 'type-contact' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">Tipo de Contato <Badge variant="success" appearance="light" size="md">{formatRecordCount(typeContacts.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie os tipos de contato da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {typeContactsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typeContactsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeContactsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <TypeContactsDataGrid
                  typeContacts={typeContacts}
                  isLoading={typeContactsLoading}
                  onSelectionChange={setTypeContactsSelected}
                  onEdit={(tc) => setEditingTypeContact(tc)}
                  onDelete={handleTypeContactsDelete}
                  onReorder={handleTypeContactsReorder}
                />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          ) : settingsSection === 'type-address' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">Tipo de Endereço <Badge variant="success" appearance="light" size="md">{formatRecordCount(typeAddresses.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie os tipos de endereço da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {typeAddressesSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typeAddressesSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeAddressesModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <TypeAddressesDataGrid
                  typeAddresses={typeAddresses}
                  isLoading={typeAddressesLoading}
                  onSelectionChange={setTypeAddressesSelected}
                  onEdit={(ta) => setEditingTypeAddress(ta)}
                  onDelete={handleTypeAddressesDelete}
                  onReorder={handleTypeAddressesReorder}
                />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          ) : settingsSection === 'type-document' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">Tipo de Documentos <Badge variant="success" appearance="light" size="md">{formatRecordCount(typeDocuments.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie os tipos de documento da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {typeDocumentsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({typeDocumentsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setTypeDocumentsModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <TypeDocumentsDataGrid
                  typeDocuments={typeDocuments}
                  isLoading={typeDocumentsLoading}
                  onSelectionChange={setTypeDocumentsSelected}
                  onEdit={(td) => setEditingTypeDocument(td)}
                  onDelete={handleTypeDocumentsDelete}
                  onReorder={handleTypeDocumentsReorder}
                />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          ) : settingsSection === 'pessoas' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">Pessoas <Badge variant="success" appearance="light" size="md">{formatRecordCount(people.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie as pessoas da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {peopleSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({peopleSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem><Badge variant="success" appearance="light" size="sm">Ativar</Badge></DropdownMenuItem>
                            <DropdownMenuItem><Badge variant="destructive" appearance="light" size="sm">Inativar</Badge></DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setPeopleModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <PeopleDataGrid
                  people={people}
                  isLoading={peopleLoading}
                  onSelectionChange={setPeopleSelected}
                  onEdit={(p) => setEditingPerson(p)}
                  onDelete={handlePeopleDelete}
                />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          ) : settingsSection === 'gabinetes' ? (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="size-5 text-muted-foreground" />Gabinetes <Badge variant="success" appearance="light" size="md">{formatRecordCount(tenants.length)}</Badge></h2>
                  <p className="text-sm text-muted-foreground">Gerencie os gabinetes da plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  {tenantsSelected > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700">
                          Ações em massa ({tenantsSelected}) <ChevronDown className="size-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="success" appearance="light" size="sm">Publicar</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Badge variant="destructive" appearance="light" size="sm">Ocultar</Badge>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">
                        <Search className="size-4 mr-2" />
                        Pesquisar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                        <Plus className="size-4 mr-2" />
                        Novo Registro
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <GabinetesDataGrid tenants={tenants} isLoading={tenantsLoading} onSelectionChange={setTenantsSelected} onEdit={setEditingTenant} />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
                <span><strong className="inline-flex items-center gap-1"><MapPin className="size-3" />ClickMaps</strong> | <strong className="inline-flex items-center gap-1"><MapPinned className="size-3" />Mapa do Voto</strong> &copy; 2012 - {new Date().getFullYear()}</span>
                <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden flex items-center justify-center border border-border">
              <p className="text-muted-foreground">Configurações — em breve</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
