<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateGenders extends Command
{
    protected $signature = 'maps:migrate-genders';

    protected $description = 'Migra registros de public.genders para maps.genders mantendo os mesmos IDs';

    public function handle(): int
    {
        $rows = DB::select('SELECT id, description, created_at, updated_at FROM public.genders');

        if (empty($rows)) {
            $this->warn('Nenhum registro encontrado em public.genders.');
            return self::SUCCESS;
        }

        $records = array_map(fn($row) => [
            'id'         => $row->id,
            'name'       => $row->description,
            'created_at' => $row->created_at,
            'updated_at' => $row->updated_at,
        ], $rows);

        $count = count($records);

        DB::statement('SET search_path TO maps');

        foreach (array_chunk($records, 500) as $chunk) {
            DB::table('maps.genders')->upsert($chunk, ['id'], [
                'name', 'created_at', 'updated_at',
            ]);
        }

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$count} gênero(s) migrado(s) para maps.genders.");

        return self::SUCCESS;
    }
}
