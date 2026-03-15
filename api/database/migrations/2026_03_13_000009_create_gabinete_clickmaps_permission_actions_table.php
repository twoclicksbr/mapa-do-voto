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

        Schema::create('permission_actions', function (Blueprint $table) {
            $table->id();
            $table->string('module');
            $table->string('action');
            $table->string('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_clickmaps.permission_actions')->insert([
            ['module' => 'people',       'action' => 'view',   'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'people',       'action' => 'create', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'people',       'action' => 'update', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'people',       'action' => 'delete', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'action' => 'view',   'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'action' => 'create', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'action' => 'update', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'action' => 'delete', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'map',          'action' => 'view',   'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'action' => 'view',   'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'action' => 'create', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'action' => 'update', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'action' => 'delete', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('permission_actions');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
