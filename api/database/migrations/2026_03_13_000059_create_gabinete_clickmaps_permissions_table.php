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

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('people_id')->constrained('gabinete_clickmaps.people');
            $table->foreignId('permission_action_id')->constrained('gabinete_clickmaps.permission_actions');
            $table->boolean('allowed')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $peopleId = DB::table('gabinete_clickmaps.people')
            ->where('name', 'Alex Alves de Almeida')
            ->value('id');

        $actions = DB::table('gabinete_clickmaps.permission_actions')->get();

        $now = now();

        $records = $actions->map(fn($action) => [
            'people_id'            => $peopleId,
            'permission_action_id' => $action->id,
            'allowed'              => true,
            'created_at'           => $now,
            'updated_at'           => $now,
        ])->all();

        DB::table('gabinete_clickmaps.permissions')->insert($records);

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('permissions');
        DB::statement('SET search_path TO maps,public');
    }
};
