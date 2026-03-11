<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::statement('DROP TABLE IF EXISTS candidates CASCADE');

        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sq_candidato')->unique();
            $table->foreignId('party_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('position_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('ballot_name')->nullable();
            $table->string('number');
            $table->smallInteger('year');
            $table->integer('cd_municipio');
            $table->string('avatar_url')->nullable();
            $table->string('status')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
