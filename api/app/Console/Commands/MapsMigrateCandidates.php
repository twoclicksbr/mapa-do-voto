<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MapsMigrateCandidates extends Command
{
    protected $signature = 'maps:migrate-candidates';

    protected $description = 'Migra registros de public.candidates para maps.candidates mantendo os mesmos IDs';

    public function handle(): int
    {
        $total = DB::selectOne('SELECT COUNT(*) AS total FROM public.candidates')->total;

        if ($total === 0) {
            $this->warn('Nenhum registro encontrado em public.candidates.');
            return self::SUCCESS;
        }

        $this->info("Migrando {$total} candidato(s)...");

        // Garante que "Não informado" existe em maps.genders
        $naoInformadoId = DB::table('maps.genders')
            ->whereRaw("LOWER(name) = 'não informado'")
            ->value('id');

        if (! $naoInformadoId) {
            $naoInformadoId = DB::table('maps.genders')->insertGetId([
                'name'       => 'Não informado',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->info("Gênero 'Não informado' criado em maps.genders com id={$naoInformadoId}.");
        }

        $chunkSize = 2000;
        $offset    = 0;
        $migrated  = 0;

        DB::statement('SET search_path TO maps');

        do {
            $rows = DB::select(
                'SELECT id, gender_id, name, cpf, photo_url, created_at, updated_at FROM public.candidates LIMIT ? OFFSET ?',
                [$chunkSize, $offset]
            );

            if (empty($rows)) {
                break;
            }

            $records = array_map(fn($row) => [
                'id'         => $row->id,
                'gender_id'  => $row->gender_id ?? $naoInformadoId,
                'name'       => $row->name,
                'cpf'        => $row->cpf,
                'photo_url'  => $row->photo_url,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ], $rows);

            DB::table('candidates')->upsert($records, ['id'], [
                'gender_id', 'name', 'cpf', 'photo_url', 'created_at', 'updated_at',
            ]);

            $migrated += count($rows);
            $offset   += $chunkSize;

            $this->info("  {$migrated}/{$total} migrados...");

        } while (count($rows) === $chunkSize);

        DB::statement('SET search_path TO maps,public');

        $this->info("Migração concluída: {$migrated} candidato(s) migrado(s) para maps.candidates.");

        return self::SUCCESS;
    }
}
