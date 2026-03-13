<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateVotingLocations extends Command
{
    protected $signature = 'maps:migrate-voting-locations';

    protected $description = 'Migra registros de public.voting_locations para maps.voting_locations mantendo os mesmos IDs';

    public function handle(): int
    {
        $total = DB::selectOne('SELECT COUNT(*) AS total FROM public.voting_locations')->total;

        if ($total === 0) {
            $this->warn('Nenhum registro encontrado em public.voting_locations.');
            return self::SUCCESS;
        }

        $this->info("Migrando {$total} local(is) de votação...");

        $chunkSize = 2000;
        $offset    = 0;
        $migrated  = 0;

        DB::statement('SET search_path TO maps');

        do {
            $rows = DB::select(
                'SELECT id, zone_id, tse_number, name, address, latitude, longitude, created_at, updated_at
                 FROM public.voting_locations
                 LIMIT ? OFFSET ?',
                [$chunkSize, $offset]
            );

            if (empty($rows)) {
                break;
            }

            // Mapeia latitude → lat, longitude → lng
            $records = array_map(fn($row) => [
                'id'         => $row->id,
                'zone_id'    => $row->zone_id,
                'tse_number' => $row->tse_number,
                'name'       => $row->name,
                'address'    => $row->address,
                'lat'        => $row->latitude,
                'lng'        => $row->longitude,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ], $rows);

            DB::table('voting_locations')->upsert($records, ['id'], [
                'zone_id', 'tse_number', 'name', 'address', 'lat', 'lng', 'created_at', 'updated_at',
            ]);

            $migrated += count($rows);
            $offset   += $chunkSize;

            $this->info("  {$migrated}/{$total} migrados...");

        } while (count($rows) === $chunkSize);

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$migrated} local(is) migrado(s) para maps.voting_locations.");

        return self::SUCCESS;
    }
}
