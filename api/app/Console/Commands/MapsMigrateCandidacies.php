<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateCandidacies extends Command
{
    protected $signature = 'maps:migrate-candidacies';

    protected $description = 'Migra registros de public.candidacies para maps.candidacies mantendo os mesmos IDs';

    public function handle(): int
    {
        $total = DB::selectOne('SELECT COUNT(*) AS total FROM public.candidacies')->total;

        if ($total === 0) {
            $this->warn('Nenhum registro encontrado em public.candidacies.');
            return self::SUCCESS;
        }

        $this->info("Migrando {$total} candidatura(s)...");

        $chunkSize = 2000;
        $offset    = 0;
        $migrated  = 0;
        $skipped   = 0;

        DB::statement('SET search_path TO maps');

        do {
            $rows = DB::select(
                'SELECT id, sq_candidato, candidate_id, party_id, country_id, state_id, city_id,
                        year, role, ballot_name, number, status, created_at, updated_at
                 FROM public.candidacies
                 LIMIT ? OFFSET ?',
                [$chunkSize, $offset]
            );

            if (empty($rows)) {
                break;
            }

            $records = [];

            foreach ($rows as $row) {
                if ($row->party_id === null) {
                    $skipped++;
                    continue;
                }
                $records[] = (array) $row;
            }

            if (! empty($records)) {
                DB::table('candidacies')->upsert($records, ['id'], [
                    'sq_candidato', 'candidate_id', 'party_id', 'country_id', 'state_id', 'city_id',
                    'year', 'role', 'ballot_name', 'number', 'status', 'created_at', 'updated_at',
                ]);
            }

            $migrated += count($records);
            $offset   += $chunkSize;

            $this->info("  {$migrated} migradas, {$skipped} puladas...");

        } while (count($rows) === $chunkSize);

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$migrated} candidatura(s) migrada(s), {$skipped} pulada(s) por party_id null.");

        return self::SUCCESS;
    }
}
