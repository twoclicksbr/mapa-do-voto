<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE maps.votes DROP CONSTRAINT IF EXISTS votes_candidacy_id_fk');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE maps.votes ADD CONSTRAINT votes_candidacy_id_fk FOREIGN KEY (candidacy_id) REFERENCES maps.candidacies(id)');
    }
};
