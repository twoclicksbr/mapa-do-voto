import { useState, useRef } from 'react';
import {
  CreditCard,
  Wallet,
  Building,
  Landmark,
  LayoutList,
  ScrollText,
  ChevronDown,
  ChevronRight,
  BanknoteArrowDown,
  BanknoteArrowUp,
  NotepadText,
  BookmarkCheck,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinMenuItem {
  title: string;
  icon: React.ElementType;
  section?: string;
  color?: 'red' | 'green';
  children?: FinMenuItem[];
}

const FIN_MENU: FinMenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, section: 'fin-dashboard' },
  {
    title: 'Cadastros',
    icon: NotepadText,
    children: [
      { title: 'Bancos',        icon: Landmark,   section: 'fin-banks' },
      {
        title: 'Modalidades',
        icon: CreditCard,
        children: [
          { title: 'Tipos',       icon: BookmarkCheck, section: 'fin-payment-method-types' },
          { title: 'Modalidades', icon: CreditCard, section: 'fin-payment-methods' },
        ],
      },
      { title: 'Departamentos', icon: Building,   section: 'fin-departments' },
      { title: 'Contas',        icon: LayoutList, section: 'fin-accounts' },
    ],
  },
  { title: 'A Pagar',   icon: BanknoteArrowDown, section: 'fin-titles-expense', color: 'red' },
  { title: 'A Receber', icon: BanknoteArrowUp,   section: 'fin-titles-income',  color: 'green' },
  { title: 'Extrato',   icon: ScrollText,         section: 'fin-extract' },
  { title: 'Carteira',  icon: Wallet,             section: 'fin-wallets' },
];

function isDescendantActive(item: FinMenuItem, activeSection: string | undefined): boolean {
  if (item.section === activeSection) return true;
  return !!item.children?.some((c) => isDescendantActive(c, activeSection));
}

interface FinMegaMenuProps {
  onNavigate?: (section: string) => void;
  activeSection?: string;
}

export function FinMegaMenu({ onNavigate, activeSection }: FinMegaMenuProps) {
  const [openIndex, setOpenIndex]   = useState<number | null>(null);
  const [openSubKey, setOpenSubKey] = useState<string | null>(null);
  const closeTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (index: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenIndex(index);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setOpenIndex(null);
      setOpenSubKey(null);
    }, 150);
  };

  const handleSubEnter = (key: string) => {
    if (subCloseTimer.current) clearTimeout(subCloseTimer.current);
    setOpenSubKey(key);
  };

  const handleSubLeave = () => {
    subCloseTimer.current = setTimeout(() => setOpenSubKey(null), 150);
  };

  return (
    <div className="px-6 py-2">
      <nav className="flex items-center gap-1">
        {FIN_MENU.map((item, index) => {
          if (item.children) {
            const isActive = isDescendantActive(item, activeSection);
            return (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                    isActive || openIndex === index
                      ? 'bg-accent text-primary'
                      : 'text-secondary-foreground hover:bg-accent hover:text-primary'
                  )}
                >
                  <item.icon className="size-4" />
                  {item.title}
                  <ChevronDown className={cn('size-3.5 transition-transform', openIndex === index && 'rotate-180')} />
                </button>

                {openIndex === index && (
                  <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-xl shadow-lg p-2 min-w-[160px] z-50 flex flex-col gap-0.5">
                    {item.children.map((child) => {
                      // Item com sub-submenu (dropdown para a direita)
                      if (child.children) {
                        const subActive = isDescendantActive(child, activeSection);
                        return (
                          <div
                            key={child.title}
                            className="relative"
                            onMouseEnter={() => handleSubEnter(child.title)}
                            onMouseLeave={handleSubLeave}
                          >
                            <button
                              className={cn(
                                'w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                subActive || openSubKey === child.title
                                  ? 'bg-accent text-primary'
                                  : 'text-secondary-foreground hover:bg-accent hover:text-primary'
                              )}
                            >
                              <span className="flex items-center gap-2">
                                <child.icon className="size-4 shrink-0" />
                                {child.title}
                              </span>
                              <ChevronRight className="size-3.5 shrink-0" />
                            </button>

                            {openSubKey === child.title && (
                              <div className="absolute top-0 left-full ml-1 bg-popover border border-border rounded-xl shadow-lg p-2 min-w-[160px] z-50 flex flex-col gap-0.5">
                                {child.children.map((grandchild) => (
                                  <button
                                    key={grandchild.title}
                                    onClick={() => {
                                      onNavigate?.(grandchild.section!);
                                      setOpenIndex(null);
                                      setOpenSubKey(null);
                                    }}
                                    className={cn(
                                      'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                      grandchild.section === activeSection
                                        ? 'bg-accent text-primary'
                                        : 'text-secondary-foreground hover:bg-accent hover:text-primary'
                                    )}
                                  >
                                    <grandchild.icon className="size-4 shrink-0" />
                                    {grandchild.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Item simples
                      return (
                        <button
                          key={child.title}
                          onClick={() => { onNavigate?.(child.section!); setOpenIndex(null); }}
                          className={cn(
                            'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                            child.section === activeSection
                              ? 'bg-accent text-primary'
                              : 'text-secondary-foreground hover:bg-accent hover:text-primary'
                          )}
                        >
                          <child.icon className="size-4 shrink-0" />
                          {child.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive  = item.section === activeSection;
          const colorClass = item.color === 'red'
            ? isActive ? 'bg-red-50 text-red-600' : 'text-red-500 hover:bg-red-50 hover:text-red-600'
            : item.color === 'green'
            ? isActive ? 'bg-green-50 text-green-600' : 'text-green-500 hover:bg-green-50 hover:text-green-600'
            : isActive ? 'bg-accent text-primary' : 'text-secondary-foreground hover:bg-accent hover:text-primary';

          return (
            <button
              key={item.title}
              onClick={() => onNavigate?.(item.section!)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                colorClass
              )}
            >
              <item.icon className="size-4" />
              {item.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
