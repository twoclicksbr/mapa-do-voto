<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_master');

        Schema::create('permission_actions', function (Blueprint $table) {
            $table->id();
            $table->string('module');
            $table->string('name_module')->nullable();
            $table->string('action');
            $table->string('name_action')->nullable();
            $table->string('description')->nullable();
            $table->integer('order')->nullable()->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.permission_actions')->insert([
            ['module' => 'people',       'name_module' => 'Pessoas',      'action' => 'view',   'name_action' => 'Visualizar', 'order' => 1,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'people',       'name_module' => 'Pessoas',      'action' => 'create', 'name_action' => 'Criar',      'order' => 2,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'people',       'name_module' => 'Pessoas',      'action' => 'update', 'name_action' => 'Editar',     'order' => 3,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'people',       'name_module' => 'Pessoas',      'action' => 'delete', 'name_action' => 'Excluir',    'order' => 4,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'name_module' => 'Atendimentos', 'action' => 'view',   'name_action' => 'Visualizar', 'order' => 5,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'name_module' => 'Atendimentos', 'action' => 'create', 'name_action' => 'Criar',      'order' => 6,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'name_module' => 'Atendimentos', 'action' => 'update', 'name_action' => 'Editar',     'order' => 7,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'attendances',  'name_module' => 'Atendimentos', 'action' => 'delete', 'name_action' => 'Excluir',    'order' => 8,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'map',          'name_module' => 'Mapa',         'action' => 'view',   'name_action' => 'Visualizar', 'order' => 9,  'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'name_module' => 'Restrições',   'action' => 'view',   'name_action' => 'Visualizar', 'order' => 10, 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'name_module' => 'Restrições',   'action' => 'create', 'name_action' => 'Criar',      'order' => 11, 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'name_module' => 'Restrições',   'action' => 'update', 'name_action' => 'Editar',     'order' => 12, 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ['module' => 'restrictions', 'name_module' => 'Restrições',   'action' => 'delete', 'name_action' => 'Excluir',    'order' => 13, 'description' => null, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('permission_actions');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
