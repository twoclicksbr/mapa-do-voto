<?php

namespace Database\Seeders;

use App\Models\Candidate;
use App\Models\Party;
use App\Models\Position;
use Illuminate\Database\Seeder;

class CandidateSeeder extends Seeder
{
    public function run(): void
    {
        $pl       = Party::where('abbreviation', 'PL')->firstOrFail();
        $position = Position::where('cd_cargo', 11)->firstOrFail();

        Candidate::create([
            'sq_candidato' => 250002019567,
            'party_id'     => $pl->id,
            'position_id'  => $position->id,
            'name'         => 'JOSE MENDES DE SOUZA NETO BOTA',
            'ballot_name'  => 'NETO BOTA',
            'number'       => '55',
            'year'         => 2024,
            'cd_municipio' => 63118,
            'avatar_url'   => null,
            'status'       => 'NÃO ELEITO',
            'active'       => true,
        ]);
    }
}
