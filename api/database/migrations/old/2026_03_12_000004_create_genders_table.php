<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('genders', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->timestamps();
        });

        $now = now();

        DB::table('genders')->insert([
            ['description' => 'MASCULINO',     'created_at' => $now, 'updated_at' => $now],
            ['description' => 'FEMININO',      'created_at' => $now, 'updated_at' => $now],
            ['description' => 'NÃO INFORMADO', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('genders');
    }
};
