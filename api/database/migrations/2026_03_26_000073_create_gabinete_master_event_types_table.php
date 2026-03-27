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

        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color');
            $table->integer('order')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.event_types')->insert([
            ['name' => 'Aniversário',  'color' => '#3fb6ea', 'order' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Financeiro',   'color' => '#4fb589', 'order' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Compromisso',  'color' => '#fbb810', 'order' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Atendimento',  'color' => '#ec637f', 'order' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('event_types');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
