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
            $table->integer('cd_eleicao')->nullable();
            $table->char('sg_uf', 2)->nullable();
            $table->integer('cd_municipio')->nullable();
            $table->string('nm_municipio', 100)->nullable();
            $table->smallInteger('nr_zona')->nullable();
            $table->smallInteger('nr_secao')->nullable();
            $table->tinyInteger('cd_cargo')->nullable();
            $table->string('ds_cargo', 50)->nullable();
            $table->bigInteger('sq_candidato')->nullable();
            $table->string('nr_votavel', 10)->nullable();
            $table->string('nm_votavel', 100)->nullable();
            $table->integer('qt_votos')->nullable();
            $table->integer('nr_local_votacao')->nullable();
            $table->string('nm_local_votacao', 150)->nullable();

            $table->index('sq_candidato');
            $table->index('cd_municipio');
            $table->index(['sq_candidato', 'nr_turno', 'cd_cargo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tse_votacao_secao');
    }
};
