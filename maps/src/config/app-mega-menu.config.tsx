import { ShieldCheck, Users, ReplaceAll, Phone, MapPin, FileText, BookmarkCheck, NotepadText, LayoutDashboard, Building2 } from 'lucide-react';
import { MenuConfig } from '@/config/types';

export const MENU_MEGA: MenuConfig = [
  { title: 'Dashboard', section: 'settings-dashboard', icon: LayoutDashboard },
  {
    title: 'Cadastros',
    icon: NotepadText,
    children: [
      { title: 'Permissões', section: 'permission-actions', icon: ShieldCheck },
      {
        title: 'Pessoas',
        icon: Users,
        children: [
          { title: 'Tipo de Pessoas', section: 'type-people', icon: BookmarkCheck },
        ],
      },
      {
        title: 'Submódulos',
        icon: ReplaceAll,
        children: [
          {
            title: 'Contatos',
            icon: Phone,
            children: [
              { title: 'Tipo de Contato', section: 'type-contact', icon: BookmarkCheck },
            ],
          },
          {
            title: 'Endereços',
            icon: MapPin,
            children: [
              { title: 'Tipo de Endereço', section: 'type-address', icon: BookmarkCheck },
            ],
          },
          {
            title: 'Documentos',
            icon: FileText,
            children: [
              { title: 'Tipo de Documentos', section: 'type-document', icon: BookmarkCheck },
            ],
          },
        ],
      },
    ],
  },
  { title: 'Gabinetes', path: '/gabinetes', icon: Building2 },
  { title: 'Pessoas', section: 'pessoas', icon: Users },
];
