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

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('people_id');
            $table->foreignId('event_type_id')->constrained('event_types');
            $table->string('modulo')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamp('start_at');
            $table->timestamp('end_at')->nullable();
            $table->string('gcal_event_id')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('events');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
