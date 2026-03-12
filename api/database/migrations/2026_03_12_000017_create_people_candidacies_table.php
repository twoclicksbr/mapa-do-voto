<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people_candidacies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('people_id')->constrained('people')->cascadeOnDelete();
            $table->foreignId('candidacy_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['people_id', 'candidacy_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people_candidacies');
    }
};
