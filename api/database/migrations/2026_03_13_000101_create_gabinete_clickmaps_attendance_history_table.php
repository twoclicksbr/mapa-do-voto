<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');

        Schema::create('attendance_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_id')->constrained('gabinete_clickmaps.attendances');
            $table->enum('status', ['aberto', 'em_andamento', 'resolvido']);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('attendance_history');
        DB::statement('SET search_path TO maps,public');
    }
};
