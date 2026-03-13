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

        Schema::create('genders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        $now = now();

        DB::table('maps.genders')->insert([
            ['name' => 'Masculino',     'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Feminino',      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Não informado', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('genders');
        DB::statement('SET search_path TO maps,public');
    }
};
