<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('people_id')->constrained('people')->cascadeOnDelete();
            $table->string('permission', 100);
            $table->timestamps();

            $table->unique(['people_id', 'permission']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people_permissions');
    }
};
