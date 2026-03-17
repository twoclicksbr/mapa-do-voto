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
            $table->string('name');
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.type_people')->insert([
            ['name' => 'Admin',    'order' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Político', 'order' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Equipe',   'order' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Eleitor',  'order' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
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
