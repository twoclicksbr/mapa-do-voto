<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_master');

        Schema::table('gabinete_master.event_types', function (Blueprint $table) {
            $table->boolean('all_day')->default(false)->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('gabinete_master.event_types', function (Blueprint $table) {
            $table->dropColumn('all_day');
        });
    }
};
