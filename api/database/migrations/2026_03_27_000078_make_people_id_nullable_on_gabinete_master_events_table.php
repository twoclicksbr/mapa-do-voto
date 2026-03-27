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
            $table->bigInteger('people_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // intentionally left as no-op
    }
};
