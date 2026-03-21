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

        Schema::create('type_documents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mask')->nullable();
            $table->boolean('validity')->default(false);
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.type_documents')->insert([
            ['name' => 'CPF',               'mask' => '999.999.999-99', 'validity' => false, 'order' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'RG',                'mask' => '99.999.999-9',   'validity' => false, 'order' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'CNH',               'mask' => null,             'validity' => false, 'order' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Passaporte',        'mask' => null,             'validity' => true,  'order' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Título de Eleitor', 'mask' => null,             'validity' => false, 'order' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('type_documents');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
