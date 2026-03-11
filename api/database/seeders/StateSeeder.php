<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\State;
use Illuminate\Database\Seeder;

class StateSeeder extends Seeder
{
    public function run(): void
    {
        $brazil = Country::where('iso2', 'BR')->firstOrFail();

        $states = [
            ['name' => 'Acre',                'uf' => 'AC', 'ibge_code' => '12'],
            ['name' => 'Alagoas',             'uf' => 'AL', 'ibge_code' => '27'],
            ['name' => 'Amapá',               'uf' => 'AP', 'ibge_code' => '16'],
            ['name' => 'Amazonas',            'uf' => 'AM', 'ibge_code' => '13'],
            ['name' => 'Bahia',               'uf' => 'BA', 'ibge_code' => '29'],
            ['name' => 'Ceará',               'uf' => 'CE', 'ibge_code' => '23'],
            ['name' => 'Distrito Federal',    'uf' => 'DF', 'ibge_code' => '53'],
            ['name' => 'Espírito Santo',      'uf' => 'ES', 'ibge_code' => '32'],
            ['name' => 'Goiás',               'uf' => 'GO', 'ibge_code' => '52'],
            ['name' => 'Maranhão',            'uf' => 'MA', 'ibge_code' => '21'],
            ['name' => 'Mato Grosso',         'uf' => 'MT', 'ibge_code' => '51'],
            ['name' => 'Mato Grosso do Sul',  'uf' => 'MS', 'ibge_code' => '50'],
            ['name' => 'Minas Gerais',        'uf' => 'MG', 'ibge_code' => '31'],
            ['name' => 'Pará',                'uf' => 'PA', 'ibge_code' => '15'],
            ['name' => 'Paraíba',             'uf' => 'PB', 'ibge_code' => '25'],
            ['name' => 'Paraná',              'uf' => 'PR', 'ibge_code' => '41'],
            ['name' => 'Pernambuco',          'uf' => 'PE', 'ibge_code' => '26'],
            ['name' => 'Piauí',               'uf' => 'PI', 'ibge_code' => '22'],
            ['name' => 'Rio de Janeiro',      'uf' => 'RJ', 'ibge_code' => '33'],
            ['name' => 'Rio Grande do Norte', 'uf' => 'RN', 'ibge_code' => '24'],
            ['name' => 'Rio Grande do Sul',   'uf' => 'RS', 'ibge_code' => '43'],
            ['name' => 'Rondônia',            'uf' => 'RO', 'ibge_code' => '11'],
            ['name' => 'Roraima',             'uf' => 'RR', 'ibge_code' => '14'],
            ['name' => 'Santa Catarina',      'uf' => 'SC', 'ibge_code' => '42'],
            ['name' => 'São Paulo',           'uf' => 'SP', 'ibge_code' => '35'],
            ['name' => 'Sergipe',             'uf' => 'SE', 'ibge_code' => '28'],
            ['name' => 'Tocantins',           'uf' => 'TO', 'ibge_code' => '17'],
        ];

        foreach ($states as $state) {
            State::firstOrCreate(
                ['uf' => $state['uf']],
                [
                    'country_id' => $brazil->id,
                    'name'       => $state['name'],
                    'ibge_code'  => $state['ibge_code'],
                ]
            );
        }
    }
}
