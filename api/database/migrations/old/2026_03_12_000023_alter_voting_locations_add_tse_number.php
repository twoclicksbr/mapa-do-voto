<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voting_locations', function (Blueprint $table) {
            // Remove section_id (orphanada após restructure)
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');

            // Número do local de votação (nr_local_votacao do TSE)
            $table->unsignedInteger('tse_number')->after('zone_id');

            $table->unique(['zone_id', 'tse_number']);
        });
    }

    public function down(): void
    {
        Schema::table('voting_locations', function (Blueprint $table) {
            $table->dropUnique(['zone_id', 'tse_number']);
            $table->dropColumn('tse_number');

            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
        });
    }
};
