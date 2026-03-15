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

        if (!Schema::hasTable('cities')) {
            Schema::create('cities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('state_id')->constrained('maps.states');
                $table->string('name');
                $table->string('ibge_code')->nullable();
                $table->string('tse_code')->nullable();
                $table->json('geometry')->nullable();
                $table->timestamps();
            });
        }

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('cities');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
