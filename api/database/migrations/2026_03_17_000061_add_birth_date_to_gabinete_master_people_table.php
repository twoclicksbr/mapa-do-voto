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

        Schema::table('people', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->after('name');
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');

        Schema::table('people', function (Blueprint $table) {
            $table->dropColumn('birth_date');
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
