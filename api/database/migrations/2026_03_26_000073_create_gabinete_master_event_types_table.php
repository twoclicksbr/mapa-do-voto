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
            $table->boolean('all_day')->default(false);
            $table->integer('order')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.event_types')->insert([
            ['name' => 'Aniversário',        'color' => '#3fb6ea', 'all_day' => true,  'order' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Financeiro Pagar',   'color' => '#ec637f', 'all_day' => true,  'order' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Financeiro Receber', 'color' => '#4fb589', 'all_day' => true,  'order' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Compromisso',        'color' => '#fbb810', 'all_day' => false, 'order' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Atendimento',        'color' => '#b665ec', 'all_day' => false, 'order' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
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
