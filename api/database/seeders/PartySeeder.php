<?php

namespace Database\Seeders;

use App\Models\Party;
use Illuminate\Database\Seeder;

class PartySeeder extends Seeder
{
    public function run(): void
    {
        $parties = [
            ['name' => 'Partido dos Trabalhadores',                        'abbreviation' => 'PT'],
            ['name' => 'Partido Liberal',                                  'abbreviation' => 'PL'],
            ['name' => 'União Brasil',                                     'abbreviation' => 'UNIÃO'],
            ['name' => 'Movimento Democrático Brasileiro',                 'abbreviation' => 'MDB'],
            ['name' => 'Progressistas',                                    'abbreviation' => 'PP'],
            ['name' => 'Republicanos',                                     'abbreviation' => 'REPUBLICANOS'],
            ['name' => 'Partido Social Democrático',                       'abbreviation' => 'PSD'],
            ['name' => 'Partido da Social Democracia Brasileira',          'abbreviation' => 'PSDB'],
            ['name' => 'Partido Democrático Trabalhista',                  'abbreviation' => 'PDT'],
            ['name' => 'Partido Socialista Brasileiro',                    'abbreviation' => 'PSB'],
            ['name' => 'Solidariedade',                                    'abbreviation' => 'SOLIDARIEDADE'],
            ['name' => 'Avante',                                           'abbreviation' => 'AVANTE'],
            ['name' => 'Patriota',                                         'abbreviation' => 'PATRIOTA'],
            ['name' => 'Partido Republicano da Ordem Social',              'abbreviation' => 'PROS'],
            ['name' => 'Democracia Cristã',                                'abbreviation' => 'DC'],
            ['name' => 'Partido Comunista do Brasil',                      'abbreviation' => 'PCdoB'],
            ['name' => 'Partido Socialismo e Liberdade',                   'abbreviation' => 'PSOL'],
            ['name' => 'Rede Sustentabilidade',                            'abbreviation' => 'REDE'],
            ['name' => 'Partido da Mobilização Nacional',                  'abbreviation' => 'PMN'],
            ['name' => 'Agir',                                             'abbreviation' => 'AGIR'],
            ['name' => 'Partido Renovação Trabalhista Brasileiro',         'abbreviation' => 'PRTB'],
            ['name' => 'Unidade Popular',                                  'abbreviation' => 'UP'],
            ['name' => 'Partido Socialista dos Trabalhadores Unificado',   'abbreviation' => 'PSTU'],
            ['name' => 'Partido Comunista Brasileiro',                     'abbreviation' => 'PCB'],
            ['name' => 'Partido da Causa Operária',                        'abbreviation' => 'PCO'],
            ['name' => 'Novo',                                             'abbreviation' => 'NOVO'],
            ['name' => 'Podemos',                                          'abbreviation' => 'PODEMOS'],
            ['name' => 'Cidadania',                                        'abbreviation' => 'CIDADANIA'],
            ['name' => 'Partido Verde',                                    'abbreviation' => 'PV'],
            ['name' => 'Partido Renovação Democrática',                    'abbreviation' => 'PRD'],
        ];

        foreach ($parties as $party) {
            Party::create([
                'name'         => $party['name'],
                'abbreviation' => $party['abbreviation'],
                'active'       => true,
            ]);
        }
    }
}
