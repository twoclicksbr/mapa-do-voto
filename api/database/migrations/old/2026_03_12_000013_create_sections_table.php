<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained()->cascadeOnDelete();
            $table->integer('section_number');
            $table->timestamps();

            $table->unique(['zone_id', 'section_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
