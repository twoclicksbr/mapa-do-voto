<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

        DB::table('gabinete_clickmaps.tenants')->insert([
            'name'       => 'Mapa do Voto',
            'slug'       => 'mapadovoto',
            'schema'     => 'gabinete_clickmaps',
            'active'     => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('tenants');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
