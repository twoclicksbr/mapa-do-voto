<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->integer('ibge_code')->unique()->nullable();
            $table->integer('tse_code')->unique();
            $table->string('name', 100);
            $table->char('sg_uf', 2);
            $table->timestamps();

            $table->index('ibge_code');
            $table->index('tse_code');
            $table->index('sg_uf');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
