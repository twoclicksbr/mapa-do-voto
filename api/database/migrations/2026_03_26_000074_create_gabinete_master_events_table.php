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
            $table->unsignedBigInteger('people_id')->nullable();
            $table->foreignId('event_type_id')->constrained('event_types');
            $table->string('modulo')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamp('start_at');
            $table->timestamp('end_at')->nullable();
            $table->boolean('all_day')->default(false);
            $table->string('recurrence')->default('none');
            $table->string('gcal_event_id')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.events')->insert([
            [
                'people_id'      => 1,
                'event_type_id'  => 1,
                'modulo'         => 'people',
                'name'           => 'Aniversário de Alex Alves de Almeida',
                'description'    => null,
                'start_at'       => '2026-05-09 00:00:00',
                'end_at'         => null,
                'all_day'        => true,
                'recurrence'     => 'yearly',
                'gcal_event_id'  => null,
                'active'         => true,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('events');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
