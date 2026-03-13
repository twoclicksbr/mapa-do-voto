import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayout } from './context';

export function SidebarHeader() {
  const { sidebarToggle } = useLayout();

  return (
    <div className="flex items-center justify-end shrink-0 px-5 py-2.5 border-b border-border">
      <Button mode="icon" variant="ghost" onClick={() => sidebarToggle()} className="hidden lg:inline-flex">
        <PanelLeft />
      </Button>
    </div>
  );
}
