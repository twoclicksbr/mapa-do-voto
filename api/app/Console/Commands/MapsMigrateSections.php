<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateSections extends Command
{
    protected $signature = 'maps:migrate-sections';

    protected $description = 'Migra registros de public.sections para maps.sections mantendo os mesmos IDs';

    public function handle(): int
    {
        $total = DB::selectOne('SELECT COUNT(*) AS total FROM public.sections')->total;

        if ($total === 0) {
            $this->warn('Nenhum registro encontrado em public.sections.');
            return self::SUCCESS;
        }

        $this->info("Migrando {$total} seção(ões)...");

        $chunkSize = 2000;
        $offset    = 0;
        $migrated  = 0;

        DB::statement('SET search_path TO maps');

        do {
            $rows = DB::select(
                'SELECT id, voting_location_id, section_number, created_at, updated_at
                 FROM public.sections
                 LIMIT ? OFFSET ?',
                [$chunkSize, $offset]
            );

            if (empty($rows)) {
                break;
            }

            $records = array_map(fn($row) => (array) $row, $rows);

            DB::table('sections')->upsert($records, ['id'], [
                'voting_location_id', 'section_number', 'created_at', 'updated_at',
            ]);

            $migrated += count($rows);
            $offset   += $chunkSize;

            $this->info("  {$migrated}/{$total} migradas...");

        } while (count($rows) === $chunkSize);

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$migrated} seção(ões) migrada(s) para maps.sections.");

        return self::SUCCESS;
    }
}
