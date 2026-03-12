<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS votes CASCADE');

        DB::unprepared('
            CREATE TABLE votes (
                id                  bigserial       NOT NULL,
                candidacy_id        bigint,
                country_id          int             NOT NULL,
                state_id            int             NOT NULL,
                city_id             int             NOT NULL,
                zone_id             int             NOT NULL,
                section_id          int             NOT NULL,
                voting_location_id  bigint,
                year                int             NOT NULL,
                round               int             NOT NULL,
                qty_votes           int             NOT NULL DEFAULT 0,
                vote_type           varchar(16)     NOT NULL DEFAULT \'candidate\',
                created_at          timestamp,
                updated_at          timestamp,
                PRIMARY KEY (id, year, state_id)
            ) PARTITION BY RANGE (year)
        ');

        DB::unprepared('
            CREATE TABLE votes_2024
                PARTITION OF votes
                FOR VALUES FROM (2024) TO (2025)
                PARTITION BY LIST (state_id)
        ');

        DB::unprepared('
            CREATE TABLE votes_2022
                PARTITION OF votes
                FOR VALUES FROM (2022) TO (2023)
                PARTITION BY LIST (state_id)
        ');

        DB::unprepared('
            CREATE TABLE votes_default
                PARTITION OF votes
                DEFAULT
        ');

        DB::unprepared('
            CREATE TABLE votes_2024_default
                PARTITION OF votes_2024
                DEFAULT
        ');

        DB::unprepared('
            CREATE TABLE votes_2022_default
                PARTITION OF votes_2022
                DEFAULT
        ');

        DB::unprepared('CREATE INDEX idx_votes_candidacy_id ON votes (candidacy_id)');
        DB::unprepared('CREATE INDEX idx_votes_city_id      ON votes (city_id)');
        DB::unprepared('CREATE INDEX idx_votes_vote_type    ON votes (vote_type)');
    }

    public function down(): void
    {
        DB::unprepared('DROP TABLE IF EXISTS votes CASCADE');
    }
};
