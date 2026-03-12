<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('uf', 2)->unique();
            $table->json('geometry')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('states')->insert([
            ['country_id' => 1, 'name' => 'Acre',                'uf' => 'AC', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Alagoas',             'uf' => 'AL', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Amapá',               'uf' => 'AP', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Amazonas',            'uf' => 'AM', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Bahia',               'uf' => 'BA', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Ceará',               'uf' => 'CE', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Distrito Federal',    'uf' => 'DF', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Espírito Santo',      'uf' => 'ES', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Goiás',               'uf' => 'GO', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Maranhão',            'uf' => 'MA', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Mato Grosso',         'uf' => 'MT', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Mato Grosso do Sul',  'uf' => 'MS', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Minas Gerais',        'uf' => 'MG', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Pará',                'uf' => 'PA', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Paraíba',             'uf' => 'PB', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Paraná',              'uf' => 'PR', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Pernambuco',          'uf' => 'PE', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Piauí',               'uf' => 'PI', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rio de Janeiro',      'uf' => 'RJ', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rio Grande do Norte', 'uf' => 'RN', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rio Grande do Sul',   'uf' => 'RS', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Rondônia',            'uf' => 'RO', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Roraima',             'uf' => 'RR', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Santa Catarina',      'uf' => 'SC', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'São Paulo',           'uf' => 'SP', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Sergipe',             'uf' => 'SE', 'created_at' => $now, 'updated_at' => $now],
            ['country_id' => 1, 'name' => 'Tocantins',           'uf' => 'TO', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('states');
    }
};
