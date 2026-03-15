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

        if (!Schema::hasTable('countries')) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->json('geometry')->nullable();
                $table->timestamps();
            });
        }

        DB::table('maps.countries')->insert([
            'name'       => 'Brasil',
            'geometry'   => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('countries');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
