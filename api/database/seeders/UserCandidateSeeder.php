<?php

namespace Database\Seeders;

use App\Models\UserCandidate;
use Illuminate\Database\Seeder;

class UserCandidateSeeder extends Seeder
{
    public function run(): void
    {
        UserCandidate::create([
            'user_id'      => 1,
            'candidate_id' => 1,
            'order'        => 1,
            'active'       => true,
        ]);
    }
}
