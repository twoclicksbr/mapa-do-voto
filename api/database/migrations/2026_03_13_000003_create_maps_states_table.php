<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO maps');

        Schema::create('states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained('maps.countries');
            $table->string('name');
            $table->char('uf', 2)->unique();
            $table->longText('geometry')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('maps.states')->insert([
            ['country_id' => 1, 'name' => 'Acre',                'uf' => 'AC', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Alagoas',             'uf' => 'AL', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Amapá',               'uf' => 'AP', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Amazonas',            'uf' => 'AM', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Bahia',               'uf' => 'BA', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Ceará',               'uf' => 'CE', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Distrito Federal',    'uf' => 'DF', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Espírito Santo',      'uf' => 'ES', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Goiás',               'uf' => 'GO', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Maranhão',            'uf' => 'MA', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Mato Grosso',         'uf' => 'MT', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Mato Grosso do Sul',  'uf' => 'MS', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Minas Gerais',        'uf' => 'MG', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Pará',                'uf' => 'PA', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Paraíba',             'uf' => 'PB', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Paraná',              'uf' => 'PR', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Pernambuco',          'uf' => 'PE', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Piauí',               'uf' => 'PI', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rio de Janeiro',      'uf' => 'RJ', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rio Grande do Norte', 'uf' => 'RN', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rio Grande do Sul',   'uf' => 'RS', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rondônia',            'uf' => 'RO', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Roraima',             'uf' => 'RR', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Santa Catarina',      'uf' => 'SC', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'São Paulo',           'uf' => 'SP', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Sergipe',             'uf' => 'SE', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Tocantins',           'uf' => 'TO', 'geometry' => null, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('states');
        DB::statement('SET search_path TO maps,public');
    }
};
