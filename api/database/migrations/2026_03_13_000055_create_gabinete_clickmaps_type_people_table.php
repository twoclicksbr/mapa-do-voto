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

        Schema::create('type_people', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_clickmaps.type_people')->insert([
            ['name' => 'Eleitor',        'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Liderança',      'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cabo Eleitoral', 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Assessor',       'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Colaborador',    'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('type_people');
        DB::statement('SET search_path TO maps,public');
    }
};
