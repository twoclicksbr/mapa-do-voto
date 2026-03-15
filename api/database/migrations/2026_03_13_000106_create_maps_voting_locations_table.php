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

        if (!Schema::hasTable('voting_locations')) {
            Schema::create('voting_locations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('zone_id')->constrained('maps.zones');
                $table->integer('tse_number');
                $table->string('name');
                $table->string('address');
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->timestamps();
            });
        }

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('voting_locations');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
