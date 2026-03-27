<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_master');

        Schema::table('gabinete_master.events', function (Blueprint $table) {
            $table->string('recurrence')->default('none')->after('all_day');
        });
    }

    public function down(): void
    {
        Schema::table('gabinete_master.events', function (Blueprint $table) {
            $table->dropColumn('recurrence');
        });
    }
};
