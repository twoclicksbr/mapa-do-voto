<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateParties extends Command
{
    protected $signature = 'maps:migrate-parties';

    protected $description = 'Migra registros de public.parties para maps.parties mantendo os mesmos IDs';

    public function handle(): int
    {
        $rows = DB::select('SELECT id, name, abbreviation, color_bg, color_text, color_gradient, created_at, updated_at FROM public.parties');

        if (empty($rows)) {
            $this->warn('Nenhum registro encontrado em public.parties.');
            return self::SUCCESS;
        }

        $records = array_map(fn($row) => (array) $row, $rows);
        $count   = count($records);

        DB::statement('SET search_path TO maps');

        foreach (array_chunk($records, 500) as $chunk) {
            DB::table('maps.parties')->upsert($chunk, ['id'], [
                'name', 'abbreviation', 'color_bg', 'color_text', 'color_gradient', 'created_at', 'updated_at',
            ]);
        }

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$count} partido(s) migrado(s) para maps.parties.");

        return self::SUCCESS;
    }
}
