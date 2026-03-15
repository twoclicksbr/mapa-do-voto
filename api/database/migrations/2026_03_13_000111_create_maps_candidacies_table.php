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

        if (!Schema::hasTable('candidacies')) {
            Schema::create('candidacies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('candidate_id')->constrained('maps.candidates');
                $table->foreignId('party_id')->nullable()->constrained('maps.parties');
                $table->foreignId('country_id')->constrained('maps.countries');
                $table->foreignId('state_id')->constrained('maps.states');
                $table->foreignId('city_id')->nullable()->constrained('maps.cities');
                $table->integer('year');
                $table->string('role');
                $table->string('ballot_name');
                $table->integer('number')->nullable();
                $table->string('status')->nullable();
                $table->string('sq_candidato')->nullable();
                $table->timestamps();
            });
        }

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('candidacies');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
