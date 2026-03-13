<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS maps');
        DB::statement('GRANT ALL ON SCHEMA maps TO ' . config('database.connections.pgsql.username'));
    }

    public function down(): void
    {
        DB::statement('DROP SCHEMA IF EXISTS maps CASCADE');
    }
};
