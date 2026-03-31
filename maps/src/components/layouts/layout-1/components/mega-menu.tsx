import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { MENU_MEGA } from '@/config/app-mega-menu.config';
import { cn } from '@/lib/utils';
import { useActiveTab } from '@/components/layout/active-tab-context';
import { MenuItem } from '@/config/types';

interface MegaMenuProps {
  onNavigate?: (section: string) => void;
  activeSection?: string;
  menu?: typeof MENU_MEGA;
}

function hasActiveDescendant(item: MenuItem, activeSection?: string): boolean {
  if (!activeSection) return false;
  if (item.section === activeSection) return true;
  return !!item.children?.some((c) => hasActiveDescendant(c, activeSection));
}

function PanelItem({ item, onNavigate, activeSection }: { item: MenuItem; onNavigate?: (section: string) => void; activeSection?: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = item.children && item.children.length > 0;

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  };

  if (hasChildren) {
    const isActive = hasActiveDescendant(item, activeSection);
    return (
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
          isActive || open
            ? 'bg-accent text-primary'
            : 'text-secondary-foreground hover:bg-accent hover:text-primary'
        )}>
          <span className="flex items-center gap-2">{item.icon && <item.icon className="size-4 shrink-0" />}{item.title}</span>
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute left-full top-0 bg-popover border border-border rounded-xl shadow-lg p-2 min-w-[180px] z-50 flex flex-col gap-0.5">
            {item.children!.map((sub) => (
              <PanelItem key={sub.title} item={sub} onNavigate={onNavigate} activeSection={activeSection} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = item.section === activeSection;
  return item.section ? (
    <button
      onClick={() => onNavigate?.(item.section!)}
      className={cn(
        'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive ? 'bg-accent text-primary' : 'text-secondary-foreground hover:bg-accent hover:text-primary'
      )}
    >
      {item.icon && <item.icon className="size-4 shrink-0" />}
      {item.title}
    </button>
  ) : (
    <Link
      to={item.path ?? '#'}
      className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-secondary-foreground font-medium hover:bg-accent hover:text-primary transition-colors"
    >
      {item.title}
    </Link>
  );
}

export function MegaMenu({ onNavigate, activeSection, menu: menuProp }: MegaMenuProps) {
  const { setActiveTab } = useActiveTab();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menu = menuProp ?? MENU_MEGA;

  const linkClass = 'text-sm font-medium transition-colors';

  const isChildActive = (item: (typeof MENU_MEGA)[0]): boolean => {
    if (!activeSection) return false;
    const checkChildren = (children: typeof item.children): boolean =>
      !!children?.some((c) => c.section === activeSection || checkChildren(c.children));
    return checkChildren(item.children);
  };

  const handleMouseEnter = (index: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(index);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpenIndex(null), 150);
  };

  return (
    <nav className="flex items-center gap-1">
      {menu.map((item, index) => {
        const hasChildren = item.children && item.children.length > 0;
        const isGabinetes = item.title === 'Gabinetes';
        const isPessoas = item.title === 'Pessoas';

        if (item.section && !hasChildren) {
          const isActive = item.section === activeSection;
          return (
            <button
              key={item.title}
              className={cn(linkClass, 'flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer',
                isActive ? 'bg-accent text-primary' : 'text-secondary-foreground hover:bg-accent hover:text-primary'
              )}
              onClick={() => onNavigate?.(item.section!)}
            >
              {item.icon && <item.icon className="size-4" />}
              {item.title}
            </button>
          );
        }

        if (isGabinetes) {
          const isActive = activeSection === 'gabinetes';
          return (
            <button
              key={item.title}
              className={cn(linkClass, 'flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer',
                isActive ? 'bg-accent text-primary' : 'text-secondary-foreground hover:bg-accent hover:text-primary'
              )}
              onClick={() => onNavigate ? onNavigate('gabinetes') : setActiveTab('gabinetes')}
            >
              <Building2 className="size-4" />
              {item.title}
            </button>
          );
        }

        if (isPessoas) {
          const isActive = activeSection === 'pessoas';
          return (
            <button
              key={item.title}
              className={cn(linkClass, 'flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer',
                isActive ? 'bg-accent text-primary' : 'text-secondary-foreground hover:bg-accent hover:text-primary'
              )}
              onClick={() => onNavigate ? onNavigate('pessoas') : setActiveTab('pessoas')}
            >
              <Users className="size-4" />
              {item.title}
            </button>
          );
        }

        if (hasChildren) {
          const isActive = isChildActive(item);
          return (
            <div
              key={item.title}
              className="relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <button className={cn(linkClass, 'flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer',
                isActive ? 'bg-accent text-primary' : 'text-secondary-foreground hover:bg-accent hover:text-primary'
              )}>
                {item.icon && <item.icon className="size-4" />}
                {item.title}
                <ChevronDown className={cn('size-3.5 transition-transform', openIndex === index && 'rotate-180')} />
              </button>
              {openIndex === index && (
                <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-xl shadow-lg p-2 min-w-[200px] z-50 flex flex-col gap-0.5">
                  {item.children!.map((child) => (
                    <PanelItem key={child.title} item={child} onNavigate={onNavigate} activeSection={activeSection} />
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.title}
            to={item.path ?? '#'}
            className={cn(linkClass, 'px-3 py-1.5 rounded-md hover:bg-accent')}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
