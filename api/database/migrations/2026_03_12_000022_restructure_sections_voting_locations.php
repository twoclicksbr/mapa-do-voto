<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Truncar sections (será reprocessada)
        DB::statement('TRUNCATE TABLE sections RESTART IDENTITY CASCADE');

        // Remover unique e FK zone_id de sections
        Schema::table('sections', function (Blueprint $table) {
            $table->dropUnique(['zone_id', 'section_number']);
            $table->dropConstrainedForeignId('zone_id');
        });

        // Adicionar voting_location_id em sections
        Schema::table('sections', function (Blueprint $table) {
            $table->unsignedBigInteger('voting_location_id')->after('id');
            $table->foreign('voting_location_id')->references('id')->on('voting_locations')->cascadeOnDelete();
            $table->unique(['voting_location_id', 'section_number']);
        });

        // Adicionar zone_id em voting_locations
        Schema::table('voting_locations', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->after('id');
            $table->foreign('zone_id')->references('id')->on('zones')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('voting_locations', function (Blueprint $table) {
            $table->dropForeign(['zone_id']);
            $table->dropColumn('zone_id');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->dropUnique(['voting_location_id', 'section_number']);
            $table->dropForeign(['voting_location_id']);
            $table->dropColumn('voting_location_id');
        });

        Schema::table('sections', function (Blueprint $table) {
            $table->unsignedBigInteger('zone_id')->after('id');
            $table->foreign('zone_id')->references('id')->on('zones')->cascadeOnDelete();
            $table->unique(['zone_id', 'section_number']);
        });
    }
};
