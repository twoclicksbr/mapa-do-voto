<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('split_candidacies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('people_candidacy_id')->constrained('people_candidacies')->cascadeOnDelete();
            $table->foreignId('candidacy_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['people_candidacy_id', 'candidacy_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('split_candidacies');
    }
};
