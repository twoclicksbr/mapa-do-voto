<?php

namespace Database\Seeders;

use App\Models\PeoplePermission;
use Illuminate\Database\Seeder;

class PeoplePermissionSeeder extends Seeder
{
    public function run(): void
    {
        PeoplePermission::create([
            'people_id'  => 1,
            'permission' => 'search_all_candidates',
        ]);
    }
}
