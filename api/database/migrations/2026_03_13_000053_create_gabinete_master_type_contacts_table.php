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

        Schema::create('type_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mask')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $now = now();

        DB::table('gabinete_master.type_contacts')->insert([
            ['name' => 'Celular',   'mask' => '(99) 99999-9999', 'order' => 1, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Telefone',  'mask' => '(99) 9999-9999',  'order' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'E-mail',    'mask' => null,              'order' => 3, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'WhatsApp',  'mask' => '(99) 99999-9999', 'order' => 4, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('type_contacts');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
