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

        if (!Schema::hasTable('split_candidacies')) {
            Schema::create('split_candidacies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('people_candidacy_id')->constrained('gabinete_master.people_candidacies')->cascadeOnDelete();
                $table->foreignId('candidacy_id')->constrained('maps.candidacies')->cascadeOnDelete();
                $table->integer('order')->default(1);
                $table->boolean('active')->default(true);
                $table->timestamps();

                $table->unique(['people_candidacy_id', 'candidacy_id']);
            });
        }

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('split_candidacies');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
