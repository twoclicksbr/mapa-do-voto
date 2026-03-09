<?php

namespace Database\Seeders;

use App\Models\UserCandidate;
use Illuminate\Database\Seeder;

class UserCandidateSeeder extends Seeder
{
    public function run(): void
    {
        $candidate = \App\Models\Candidate::where('sq_candidato', 250002019567)->firstOrFail();

        UserCandidate::create([
            'user_id'      => 1,
            'candidate_id' => $candidate->id,
            'order'        => 1,
            'active'       => true,
        ]);
    }
}
