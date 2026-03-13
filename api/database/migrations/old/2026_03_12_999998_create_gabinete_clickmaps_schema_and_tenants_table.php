<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS gabinete_clickmaps');
        DB::statement('GRANT ALL ON SCHEMA gabinete_clickmaps TO ' . config('database.connections.pgsql.username'));

        DB::statement('SET search_path TO gabinete_clickmaps');

        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('schema')->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('DROP SCHEMA IF EXISTS gabinete_clickmaps CASCADE');
    }
};
