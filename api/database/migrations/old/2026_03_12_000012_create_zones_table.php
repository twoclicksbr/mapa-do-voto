<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('city_id')->constrained()->cascadeOnDelete();
            $table->integer('zone_number');
            $table->json('geometry')->nullable();
            $table->timestamps();

            $table->unique(['city_id', 'zone_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
