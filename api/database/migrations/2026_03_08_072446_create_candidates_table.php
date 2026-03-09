<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->bigInteger('sq_candidato')->unique()->nullable();
            $table->foreignId('party_id')->nullable()->constrained('parties')->nullOnDelete();
            $table->string('name');
            $table->string('ballot_name')->nullable();
            $table->string('role');
            $table->string('number')->nullable();
            $table->smallInteger('nr_candidato')->nullable();
            $table->integer('year');
            $table->char('state', 2);
            $table->string('city_ibge_code')->nullable();
            $table->integer('cd_municipio')->nullable();
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
