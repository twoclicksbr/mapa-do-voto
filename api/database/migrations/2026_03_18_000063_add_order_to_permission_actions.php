<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gabinete_master.permission_actions', function (Blueprint $table) {
            $table->integer('order')->nullable()->default(0)->after('description');
        });

        DB::statement('
            UPDATE gabinete_master.permission_actions
            SET "order" = sub.rn
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY module, action) AS rn
                FROM gabinete_master.permission_actions
                WHERE deleted_at IS NULL
            ) sub
            WHERE gabinete_master.permission_actions.id = sub.id
        ');
    }

    public function down(): void
    {
        Schema::table('gabinete_master.permission_actions', function (Blueprint $table) {
            $table->dropColumn('order');
        });
    }
};
