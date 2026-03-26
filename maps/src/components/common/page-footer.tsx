import { MapPin, MapPinned, MousePointerClick } from 'lucide-react';

export function PageFooter() {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border text-xs text-muted-foreground">
      <span>
        <strong className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center size-3.5 rounded-sm bg-[#E63946]">
            <MapPin className="size-2 text-white" />
          </span>
          ClickMaps
        </strong>
        {' | '}
        <strong className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center size-3.5 rounded-sm bg-[#3B82F6]">
            <MapPinned className="size-2 text-white" />
          </span>
          <span>{"Mapa"}<span className="font-normal">{"do"}</span>{"Voto"}</span>
        </strong>
        {' \u00a9 2012 - '}{new Date().getFullYear()}
      </span>
      <span>Grupo: <strong className="inline-flex items-center gap-1"><MousePointerClick className="size-3" />TwoClicks</strong></span>
    </div>
  );
}
