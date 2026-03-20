<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $user = config('database.connections.pgsql.username');
        DB::statement('CREATE SCHEMA IF NOT EXISTS gabinete_master');
        DB::statement("GRANT ALL ON SCHEMA gabinete_master TO {$user}");
    }

    public function down(): void
    {
        // Schema não é dropado — as migrations de tabela cuidam de seus próprios objetos
    }
};
