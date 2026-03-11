<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS tse_votacao_secao');

        // Tabela pai — particionada por ano_eleicao
        DB::unprepared('
            CREATE TABLE tse_votacao_secao (
                ano_eleicao  smallint,
                nr_turno     smallint,
                sg_uf        char(2),
                cd_municipio integer,
                nr_zona      smallint,
                nr_secao     smallint,
                cd_cargo     smallint,
                sq_candidato bigint,
                qt_votos     integer
            ) PARTITION BY LIST (ano_eleicao)
        ');

        // Partições por ano (sub-particionadas por sg_uf)
        DB::unprepared('
            CREATE TABLE tse_votacao_secao_2024
                PARTITION OF tse_votacao_secao
                FOR VALUES IN (2024)
                PARTITION BY LIST (sg_uf)
        ');

        DB::unprepared('
            CREATE TABLE tse_votacao_secao_2022
                PARTITION OF tse_votacao_secao
                FOR VALUES IN (2022)
                PARTITION BY LIST (sg_uf)
        ');

        DB::unprepared('
            CREATE TABLE tse_votacao_secao_default
                PARTITION OF tse_votacao_secao
                DEFAULT
        ');

        // Subpartições folha — 2024
        DB::unprepared('
            CREATE TABLE tse_votacao_secao_2024_sp
                PARTITION OF tse_votacao_secao_2024
                FOR VALUES IN (\'SP\')
        ');

        DB::unprepared('
            CREATE TABLE tse_votacao_secao_2024_default
                PARTITION OF tse_votacao_secao_2024
                DEFAULT
        ');

        // Subpartições folha — 2022
        DB::unprepared('
            CREATE TABLE tse_votacao_secao_2022_ac
                PARTITION OF tse_votacao_secao_2022
                FOR VALUES IN (\'AC\')
        ');

        DB::unprepared('
            CREATE TABLE tse_votacao_secao_2022_default
                PARTITION OF tse_votacao_secao_2022
                DEFAULT
        ');

        // Índices nas partições folha
        $leaves = [
            'tse_votacao_secao_2024_sp',
            'tse_votacao_secao_2024_default',
            'tse_votacao_secao_2022_ac',
            'tse_votacao_secao_2022_default',
            'tse_votacao_secao_default',
        ];

        foreach ($leaves as $leaf) {
            DB::unprepared("
                CREATE UNIQUE INDEX ON {$leaf}
                    (sg_uf, ano_eleicao, nr_turno, cd_municipio, nr_zona, nr_secao, sq_candidato)
            ");
            DB::unprepared("CREATE INDEX ON {$leaf} (cd_municipio)");
        }
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS tse_votacao_secao');

        // Recria a tabela original simples
        DB::unprepared('
            CREATE TABLE tse_votacao_secao (
                id           bigserial PRIMARY KEY,
                ano_eleicao  smallint,
                nr_turno     smallint,
                sg_uf        char(2),
                cd_municipio integer,
                nr_zona      smallint,
                nr_secao     smallint,
                cd_cargo     smallint,
                sq_candidato bigint,
                qt_votos     integer
            )
        ');
    }
};
