<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateCities extends Command
{
    protected $signature = 'maps:migrate-cities';

    protected $description = 'Migra registros de public.cities para maps.cities mantendo os mesmos IDs';

    public function handle(): int
    {
        $total = DB::selectOne('SELECT COUNT(*) AS total FROM public.cities')->total;

        if ($total === 0) {
            $this->warn('Nenhum registro encontrado em public.cities.');
            return self::SUCCESS;
        }

        $this->info("Migrando {$total} cidade(s)...");

        $chunkSize = 2000;
        $offset    = 0;
        $migrated  = 0;

        DB::statement('SET search_path TO maps');

        do {
            $rows = DB::select(
                'SELECT id, state_id, name, ibge_code, tse_code, geometry, created_at, updated_at
                 FROM public.cities
                 LIMIT ? OFFSET ?',
                [$chunkSize, $offset]
            );

            if (empty($rows)) {
                break;
            }

            $records = array_map(fn($row) => (array) $row, $rows);

            DB::table('maps.cities')->upsert($records, ['id'], [
                'state_id', 'name', 'ibge_code', 'tse_code', 'geometry', 'created_at', 'updated_at',
            ]);

            $migrated += count($rows);
            $offset   += $chunkSize;

            $this->info("  {$migrated}/{$total} migradas...");

        } while (count($rows) === $chunkSize);

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$migrated} cidade(s) migrada(s) para maps.cities.");

        return self::SUCCESS;
    }
}
