import { MegaMenu } from "@/components/layouts/layout-1/components/mega-menu";
import { MENU_MEGA } from "@/config/app-mega-menu.config";

interface AppMegaMenuProps {
  onNavigate?: (section: string) => void;
  activeSection?: string;
  isMaster?: boolean;
}

export function AppMegaMenu({ onNavigate, activeSection, isMaster }: AppMegaMenuProps) {
  const menu = isMaster ? MENU_MEGA : MENU_MEGA.map(item => {
    if (!item.children) return item;
    return {
      ...item,
      children: item.children.filter(child => child.section !== 'plans'),
    };
  });

  return (
    <div className="px-6 py-2">
      <MegaMenu menu={menu} onNavigate={onNavigate} activeSection={activeSection}  />
    </div>
  );
}
