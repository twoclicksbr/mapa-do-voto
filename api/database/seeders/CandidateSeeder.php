<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Party;
use Illuminate\Database\Seeder;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $pl = Party::where('abbreviation', 'PL')->first();

        Candidate::create([
            'sq_candidato'   => 250002019567,
            'party_id'       => $pl->id,
            'name'           => 'José Mendes de Souza Neto Bota',
            'ballot_name'    => 'Neto Bota',
            'role'           => 'Prefeito',
            'number'         => null,
            'year'           => 2024,
            'state'          => 'SP',
            'city_ibge_code' => '3510104',
            'cd_municipio'   => 63118,
            'avatar_url'     => null,
            'status'         => 'não eleito',
            'active'         => true,
        ]);
    }
}
