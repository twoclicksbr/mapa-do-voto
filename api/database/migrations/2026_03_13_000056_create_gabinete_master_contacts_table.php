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

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('modulo');
            $table->unsignedBigInteger('record_id');
            $table->foreignId('type_contact_id')->constrained('gabinete_master.type_contacts');
            $table->string('value');
            $table->integer('order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['modulo', 'record_id']);
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_master');
        Schema::dropIfExists('contacts');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
