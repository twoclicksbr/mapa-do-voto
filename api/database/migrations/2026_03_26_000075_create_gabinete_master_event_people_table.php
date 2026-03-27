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

        Schema::create('event_people', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->unsignedBigInteger('people_id');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['event_id', 'people_id']);
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('event_people');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
