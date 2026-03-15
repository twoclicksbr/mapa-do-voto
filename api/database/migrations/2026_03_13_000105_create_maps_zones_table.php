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

        if (!Schema::hasTable('zones')) {
            Schema::create('zones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('city_id')->constrained('maps.cities');
                $table->string('zone_number');
                $table->json('geometry')->nullable();
                $table->timestamps();
            });
        }

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('zones');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
