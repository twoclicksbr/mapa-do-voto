import { PanelLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayout } from './context';
import { Link } from 'react-router';

export function SidebarHeader() {
  const { sidebarToggle } = useLayout();

  return (
    <div className="flex items-center justify-between shrink-0 px-5 py-2.5 border-b border-border">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-[#E63946]">
          <MapPin className="size-4 text-white" />
        </div>
        <span className="text-2xl text-foreground">
          <span className="font-normal">Click</span><span className="font-bold">Maps</span>
        </span>
      </Link>

      <Button mode="icon" variant="ghost" onClick={() => sidebarToggle()} className="hidden lg:inline-flex">
        <PanelLeft />
      </Button>
    </div>
  );
}
