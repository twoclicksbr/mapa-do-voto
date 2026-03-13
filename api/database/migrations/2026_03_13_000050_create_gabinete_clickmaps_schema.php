<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS gabinete_clickmaps');
        DB::statement('GRANT ALL ON SCHEMA gabinete_clickmaps TO ' . config('database.connections.pgsql.username'));
    }

    public function down(): void
    {
        DB::statement('DROP SCHEMA IF EXISTS gabinete_clickmaps CASCADE');
    }
};
