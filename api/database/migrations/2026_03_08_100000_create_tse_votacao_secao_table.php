<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tse_votacao_secao', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->smallInteger('ano_eleicao')->nullable();
            $table->tinyInteger('nr_turno')->nullable();
            $table->char('sg_uf', 2)->nullable();
            $table->integer('cd_municipio')->nullable();
            $table->smallInteger('nr_zona')->nullable();
            $table->smallInteger('nr_secao')->nullable();
            $table->tinyInteger('cd_cargo')->nullable();
            $table->bigInteger('sq_candidato')->nullable();
            $table->integer('qt_votos')->nullable();

            $table->index('sq_candidato');
            $table->index('cd_municipio');
            $table->index(['sg_uf', 'ano_eleicao', 'sq_candidato']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tse_votacao_secao');
    }
};
