<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tse_votacao_secao_raw', function (Blueprint $table) {
            $table->id();
            $table->text('dt_geracao')->nullable();
            $table->text('hh_geracao')->nullable();
            $table->text('ano_eleicao')->nullable();
            $table->text('cd_tipo_eleicao')->nullable();
            $table->text('nm_tipo_eleicao')->nullable();
            $table->text('nr_turno')->nullable();
            $table->text('cd_eleicao')->nullable();
            $table->text('ds_eleicao')->nullable();
            $table->text('dt_eleicao')->nullable();
            $table->text('tp_abrangencia')->nullable();
            $table->text('sg_uf')->nullable();
            $table->text('sg_ue')->nullable();
            $table->text('nm_ue')->nullable();
            $table->text('cd_municipio')->nullable();
            $table->text('nm_municipio')->nullable();
            $table->text('nr_zona')->nullable();
            $table->text('nr_secao')->nullable();
            $table->text('cd_cargo')->nullable();
            $table->text('ds_cargo')->nullable();
            $table->text('nr_votavel')->nullable();
            $table->text('nm_votavel')->nullable();
            $table->text('qt_votos')->nullable();
            $table->text('nr_local_votacao')->nullable();
            $table->text('sq_candidato')->nullable();
            $table->text('nm_local_votacao')->nullable();
            $table->text('ds_local_votacao_endereco')->nullable();

            $table->unique(
                ['sg_uf', 'ano_eleicao', 'nr_turno', 'cd_municipio', 'nr_zona', 'nr_secao', 'sq_candidato'],
                'tse_raw_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tse_votacao_secao_raw');
    }
};
