<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_master');

        if (!Schema::hasTable('people_candidacies')) {
            Schema::create('people_candidacies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('people_id')->constrained('gabinete_master.people')->cascadeOnDelete();
                $table->unsignedBigInteger('candidacy_id');
                $table->integer('order')->default(1);
                $table->boolean('active')->default(true);
                $table->timestamps();

                $table->unique(['people_id', 'candidacy_id']);
            });
        }

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('people_candidacies');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
