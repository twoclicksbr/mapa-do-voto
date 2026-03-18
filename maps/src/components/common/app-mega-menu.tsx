import { MegaMenu } from "@/components/layouts/layout-1/components/mega-menu";

interface AppMegaMenuProps {
  onNavigate?: (section: string) => void;
  activeSection?: string;
}

export function AppMegaMenu({ onNavigate, activeSection }: AppMegaMenuProps) {
  return (
    <div className="px-6 py-2">
      <MegaMenu onNavigate={onNavigate} activeSection={activeSection} />
    </div>
  );
}
