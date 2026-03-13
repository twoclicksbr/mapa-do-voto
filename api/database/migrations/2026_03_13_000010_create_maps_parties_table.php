<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO maps');

        Schema::create('parties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbreviation');
            $table->string('color_bg')->nullable();
            $table->string('color_text')->nullable();
            $table->string('color_gradient')->nullable();
            $table->timestamps();
        });

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('parties');
        DB::statement('SET search_path TO maps,public');
    }
};
