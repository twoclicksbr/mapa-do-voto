<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateZones extends Command
{
    protected $signature = 'maps:migrate-zones';

    protected $description = 'Migra registros de public.zones para maps.zones mantendo os mesmos IDs';

    public function handle(): int
    {
        $total = DB::selectOne('SELECT COUNT(*) AS total FROM public.zones')->total;

        if ($total === 0) {
            $this->warn('Nenhum registro encontrado em public.zones.');
            return self::SUCCESS;
        }

        $this->info("Migrando {$total} zona(s)...");

        $chunkSize = 2000;
        $offset    = 0;
        $migrated  = 0;

        DB::statement('SET search_path TO maps');

        do {
            $rows = DB::select(
                'SELECT id, city_id, zone_number, geometry, created_at, updated_at
                 FROM public.zones
                 LIMIT ? OFFSET ?',
                [$chunkSize, $offset]
            );

            if (empty($rows)) {
                break;
            }

            $records = array_map(fn($row) => (array) $row, $rows);

            DB::table('zones')->upsert($records, ['id'], [
                'city_id', 'zone_number', 'geometry', 'created_at', 'updated_at',
            ]);

            $migrated += count($rows);
            $offset   += $chunkSize;

            $this->info("  {$migrated}/{$total} migradas...");

        } while (count($rows) === $chunkSize);

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$migrated} zona(s) migrada(s) para maps.zones.");

        return self::SUCCESS;
    }
}
