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

        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('schema')->unique();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->boolean('has_schema')->default(false);
            $table->boolean('active')->default(true);
            $table->date('valid_until');
            $table->string('logo_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        $enterprisePlanId = DB::table('gabinete_master.plans')
            ->where('name', 'Mapa + Gabinete - Enterprise')
            ->value('id');

        DB::table('gabinete_master.tenants')->insert([
            'name'        => 'Mapa do Voto',
            'slug'        => 'master',
            'schema'      => 'gabinete_master',
            'plan_id'     => $enterprisePlanId,
            'active'      => true,
            'valid_until' => '2026-06-24',
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('tenants');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
