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

        Schema::create('people', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_people_id')->nullable()->constrained('gabinete_clickmaps.type_people');
            $table->string('name');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $typePeopleId = DB::table('gabinete_clickmaps.type_people')
            ->where('name', 'Admin')
            ->value('id');

        DB::table('gabinete_clickmaps.people')->insert([
            'type_people_id' => $typePeopleId,
            'name'           => 'Alex Alves de Almeida',
            'active'         => true,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('people');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
