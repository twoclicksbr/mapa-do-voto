<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $conn = DB::connection('pgsql_maps');

        // Índice principal: busca de votos por candidato + partição por year
        $conn->statement('CREATE INDEX IF NOT EXISTS idx_votes_candidacy_year_round ON maps.votes (candidacy_id, year, round)');

        // Índice para stats de escopo estadual
        $conn->statement('CREATE INDEX IF NOT EXISTS idx_votes_state_year_round_type ON maps.votes (state_id, year, round, vote_type)');

        // Índice para stats de escopo municipal e endpoint cities()
        $conn->statement('CREATE INDEX IF NOT EXISTS idx_votes_city_year_round_type ON maps.votes (city_id, year, round, vote_type)');
    }

    public function down(): void
    {
        $conn = DB::connection('pgsql_maps');

        $conn->statement('DROP INDEX IF EXISTS maps.idx_votes_candidacy_year_round');
        $conn->statement('DROP INDEX IF EXISTS maps.idx_votes_state_year_round_type');
        $conn->statement('DROP INDEX IF EXISTS maps.idx_votes_city_year_round_type');
    }
};
