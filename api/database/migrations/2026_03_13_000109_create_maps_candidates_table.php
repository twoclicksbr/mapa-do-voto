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

        if (!Schema::hasTable('candidates')) {
            Schema::create('candidates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('gender_id')->nullable()->constrained('maps.genders');
                $table->string('name');
                $table->string('cpf')->nullable();
                $table->string('photo_url')->nullable();
                $table->timestamps();
            });
        }

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('candidates');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
