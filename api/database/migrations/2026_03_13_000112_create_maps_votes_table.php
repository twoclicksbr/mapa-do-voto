<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tabela particionada não suporta Schema::create — usar SQL raw
        DB::statement('
            CREATE TABLE maps.votes (
                id                 BIGSERIAL,
                candidacy_id       BIGINT,
                country_id         INTEGER   NOT NULL,
                state_id           INTEGER   NOT NULL,
                city_id            INTEGER   NOT NULL,
                zone_id            INTEGER   NOT NULL,
                section_id         INTEGER   NOT NULL,
                voting_location_id BIGINT,
                year               INTEGER   NOT NULL,
                round              INTEGER   NOT NULL,
                qty_votes          INTEGER   NOT NULL DEFAULT 0,
                vote_type          VARCHAR(16) NOT NULL DEFAULT \'candidate\',
                created_at         TIMESTAMP,
                updated_at         TIMESTAMP,
                PRIMARY KEY (id, year)
            ) PARTITION BY RANGE (year)
        ');

        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_country_id_fk    FOREIGN KEY (country_id)          REFERENCES maps.countries(id)');
        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_state_id_fk      FOREIGN KEY (state_id)            REFERENCES maps.states(id)');
        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_city_id_fk       FOREIGN KEY (city_id)             REFERENCES maps.cities(id)');
        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_zone_id_fk       FOREIGN KEY (zone_id)             REFERENCES maps.zones(id)');
        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_vl_id_fk         FOREIGN KEY (voting_location_id)  REFERENCES maps.voting_locations(id)');
        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_section_id_fk    FOREIGN KEY (section_id)          REFERENCES maps.sections(id)');

        DB::statement('CREATE TABLE maps.votes_2022 PARTITION OF maps.votes FOR VALUES FROM (2022) TO (2023)');
        DB::statement('CREATE TABLE maps.votes_2024 PARTITION OF maps.votes FOR VALUES FROM (2024) TO (2025)');
        DB::statement('CREATE TABLE maps.votes_default PARTITION OF maps.votes DEFAULT');

        DB::statement('CREATE INDEX IF NOT EXISTS idx_votes_candidacy_year_round   ON maps.votes (candidacy_id, year, round)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_votes_state_year_round_type  ON maps.votes (state_id, year, round, vote_type)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_votes_city_year_round_type   ON maps.votes (city_id, year, round, vote_type)');
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS maps.votes CASCADE');
    }
};
