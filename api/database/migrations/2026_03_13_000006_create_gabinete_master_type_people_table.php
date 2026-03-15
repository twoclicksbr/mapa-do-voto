<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_master');

        Schema::create('type_people', function (Blueprint $table) {
            $table->id();
            $table->string('name')->notNull();
            $table->timestamps();
        });

        $now = now();

        DB::table('gabinete_master.type_people')->insert([
            ['name' => 'Admin',    'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Político', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Equipe',   'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Eleitor',  'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('type_people');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
