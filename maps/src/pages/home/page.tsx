import { useRef, useState } from "react";
import * as L from "leaflet";
import { LoginModal } from "@/components/auth/login-modal";
import { useLayout } from "@/components/layouts/layout-33/components/context";
import { Toolbar, ToolbarHeading, ToolbarActions } from "@/components/layouts/layout-33/components/toolbar";
import { Button } from "@/components/ui/button";
import { Columns2 } from "lucide-react";
import { ClickMapsMap } from "@/components/map/clickmaps-map";
import { Navbar } from "@/components/layouts/layout-33/components/navbar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HomePage() {
  const { isMobile } = useLayout();
  const [isSplit, setIsSplit] = useState(false);

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
      <Toolbar>
        <div className="flex items-center gap-3">
          <img src="/media/logo/logo.svg" alt="Mapa do Voto" className="h-7 w-auto" />
          <span className="text-lg text-foreground"><strong>Mapa</strong>do<strong>Voto</strong></span>
          <ToolbarHeading>
            <Tabs defaultValue="overview" className="text-sm text-muted-foreground">
              <TabsList size="xs">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
              </TabsList>
            </Tabs>
          </ToolbarHeading>
        </div>
        {!isMobile && (
          <ToolbarActions>
            <Button
              mode="icon"
              variant={isSplit ? "primary" : "dim"}
              onClick={handleSplitToggle}
              title="Split view"
            >
              <Columns2 />
            </Button>
            <Navbar />
          </ToolbarActions>
        )}
      </Toolbar>

      <div className="rounded-lg overflow-hidden flex-1 min-h-0 flex flex-row">
        <div className={isSplit ? "w-1/2 h-full" : "w-full h-full"}>
          <ClickMapsMap
            mapRef={mapRef1}
            syncRef={isSplit ? mapRef2 : undefined}
            onCityBoundsReady={setCityBounds}
            cityBounds={cityBounds}
          />
        </div>
        {isSplit && (
          <div className="w-1/2 h-full border-l border-border">
            <ClickMapsMap
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
    </div>
  );
}
