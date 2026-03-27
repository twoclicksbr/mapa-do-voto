<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("SET search_path TO gabinete_master");

        Schema::table('gabinete_master.events', function (Blueprint $table) {
            $table->boolean('all_day')->default(false)->after('end_at');
        });

        DB::statement("SET search_path TO gabinete_master,maps,public");
    }

    public function down(): void
    {
        DB::statement("SET search_path TO gabinete_master");

        Schema::table('gabinete_master.events', function (Blueprint $table) {
            $table->dropColumn('all_day');
        });

        DB::statement("SET search_path TO gabinete_master,maps,public");
    }
};
