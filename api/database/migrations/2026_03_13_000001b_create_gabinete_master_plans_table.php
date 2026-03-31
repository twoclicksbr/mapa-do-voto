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

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price_month', 10, 2);
            $table->decimal('price_yearly', 10, 2);
            $table->decimal('price_setup', 10, 2)->default(0);
            $table->unsignedInteger('max_users')->nullable();
            $table->boolean('has_schema')->default(false);
            $table->boolean('recommended')->default(false);
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();
        DB::table('plans')->insert([
            ['name' => 'Mapa',                         'description' => 'Visualização de votos eleitoral.',                                                         'price_month' => 0.00,   'price_yearly' => 0.00,    'price_setup' => 6000.00, 'max_users' => 1,    'has_schema' => false, 'recommended' => false, 'order' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mapa + Gabinete - Go',         'description' => "Visualização de votos eleitoral.\nGestão de gabinetes para até 1 usuário",                 'price_month' => 299.00, 'price_yearly' => 2990.00, 'price_setup' => 6000.00, 'max_users' => 1,    'has_schema' => true,  'recommended' => false, 'order' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mapa + Gabinete - Plus',       'description' => "Visualização de votos eleitoral.\nGestão de gabinetes para até 3 usuários",                'price_month' => 499.00, 'price_yearly' => 4990.00, 'price_setup' => 6000.00, 'max_users' => 3,    'has_schema' => true,  'recommended' => false, 'order' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mapa + Gabinete - Pro',        'description' => "Visualização de votos eleitoral.\nGestão de gabinetes para até 5 usuários",                'price_month' => 799.00, 'price_yearly' => 7990.00, 'price_setup' => 6000.00, 'max_users' => 5,    'has_schema' => true,  'recommended' => true,  'order' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Mapa + Gabinete - Enterprise', 'description' => "Visualização de votos eleitoral.\nGestão de gabinetes para usuários ilimitados",           'price_month' => 899.00, 'price_yearly' => 8990.00, 'price_setup' => 6000.00, 'max_users' => null, 'has_schema' => true,  'recommended' => false, 'order' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('plans');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
