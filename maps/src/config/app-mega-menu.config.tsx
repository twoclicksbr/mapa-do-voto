import { MenuConfig } from '@/config/types';

export const MENU_MEGA: MenuConfig = [
  {
    title: 'Cadastros',
    children: [
      {
        title: 'Pessoas',
        children: [
          { title: 'Tipo de Pessoas', section: 'type-people' },
        ],
      },
      {
        title: 'Submódulos',
        children: [
          {
            title: 'Contatos',
            children: [
              { title: 'Tipo de Contato', section: 'type-contact' },
            ],
          },
          {
            title: 'Endereços',
            children: [
              { title: 'Tipo de Endereço', section: 'type-address' },
            ],
          },
          {
            title: 'Documentos',
            children: [
              { title: 'Tipo de Documentos', section: 'type-document' },
            ],
          },
        ],
      },
    ],
  },
  { title: 'Gabinetes', path: '/gabinetes' },
  { title: 'Pessoas', section: 'pessoas' },
];
