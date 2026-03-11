<?php

namespace Database\Seeders;

use App\Models\People;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $people = People::create([
            'name'       => 'Alex',
            'avatar_url' => null,
            'active'     => true,
        ]);

        User::create([
            'people_id' => $people->id,
            'email'     => 'alex@clickmaps.com.br',
            'password'  => Hash::make('Alex1985@'),
        ]);

        $this->call([
            // PartySeeder::class,
            // CandidateSeeder::class,
            // UserCandidateSeeder::class,
            // PeoplePermissionSeeder::class,
        ]);
    }
}
