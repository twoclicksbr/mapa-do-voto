<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gabinete_master.permission_actions', function (Blueprint $table) {
            $table->string('name_module')->nullable()->after('module');
            $table->string('name_action')->nullable()->after('action');
        });

        // Populate name_module from known module names
        DB::statement("
            UPDATE gabinete_master.permission_actions SET name_module = CASE module
                WHEN 'people'       THEN 'Pessoas'
                WHEN 'attendances'  THEN 'Atendimentos'
                WHEN 'map'          THEN 'Mapa'
                WHEN 'restrictions' THEN 'Restrições'
                ELSE initcap(module)
            END
        ");

        // Populate name_action from known action names
        DB::statement("
            UPDATE gabinete_master.permission_actions SET name_action = CASE action
                WHEN 'view'   THEN 'Visualizar'
                WHEN 'create' THEN 'Criar'
                WHEN 'update' THEN 'Editar'
                WHEN 'delete' THEN 'Excluir'
                ELSE initcap(action)
            END
        ");
    }

    public function down(): void
    {
        Schema::table('gabinete_master.permission_actions', function (Blueprint $table) {
            $table->dropColumn(['name_module', 'name_action']);
        });
    }
};
