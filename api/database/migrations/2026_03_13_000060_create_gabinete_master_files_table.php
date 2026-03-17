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

        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('modulo');
            $table->unsignedBigInteger('record_id');
            $table->string('name');
            $table->string('path');
            $table->string('path_md')->nullable();
            $table->string('path_sm')->nullable();
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
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
        Schema::dropIfExists('files');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }
};
