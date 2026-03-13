<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER SCHEMA public RENAME TO maps');
        DB::statement('CREATE SCHEMA IF NOT EXISTS public');
        DB::statement('GRANT ALL ON SCHEMA public TO PUBLIC');
        DB::statement('GRANT ALL ON SCHEMA maps TO ' . config('database.connections.pgsql.username'));
    }

    public function down(): void
    {
        DB::statement('DROP SCHEMA IF EXISTS public CASCADE');
        DB::statement('ALTER SCHEMA maps RENAME TO public');
    }
};
