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

        if (!Schema::hasTable('tse_votacao_secao_2014')) {
            Schema::create('tse_votacao_secao_2014', function (Blueprint $table) {
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
            });
        }

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('tse_votacao_secao_2014');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
