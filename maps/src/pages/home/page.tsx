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
import { GabinetesDataGrid } from "@/components/gabinetes/gabinetes-data-grid";
import { GabinetCreateModal } from "@/components/gabinetes/gabinete-create-modal";
import { GabinetEditModal } from "@/components/gabinetes/gabinete-edit-modal";
import { AppMegaMenu } from "@/components/common/app-mega-menu";

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
  const [isSplit, setIsSplit] = useState(false);
  const tenantName = getTenantName();
  const isMaster = tenantName.toLowerCase() === 'master';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsSelected, setTenantsSelected] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (!isMaster) return;
    setTenantsLoading(true);
    api.get<Tenant[]>('/tenants')
      .then(res => setTenants(res.data))
      .finally(() => setTenantsLoading(false));
  }, [isMaster]);

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
          <TabsContent value="gabinetes" className="flex-1 min-h-0 mt-0">
            <AppMegaMenu />
            <div className="rounded-lg overflow-hidden h-full border border-border flex flex-col">
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

        <TabsContent value="alerts" className="flex-1 min-h-0 mt-0">
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Finanças — em breve</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 min-h-0 mt-0">
          <AppMegaMenu />
          <div className="rounded-lg overflow-hidden h-full flex items-center justify-center border border-border">
            <p className="text-muted-foreground">Configurações — em breve</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
