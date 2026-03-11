<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        Country::firstOrCreate(
            ['iso2' => 'BR'],
            ['name' => 'Brasil']
        );
    }
}
