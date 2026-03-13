<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class MapsMigrateVotes extends Command
{
    protected $signature = 'maps:migrate-votes {ano}';

    protected $description = 'Copia registros de public.votes para maps.votes filtrando por ano (INSERT direto, sem validação de FK)';

    private const CHUNK_SIZE = 2000;

    private const COLUMNS = [
        'id', 'candidacy_id', 'country_id', 'state_id', 'city_id', 'zone_id',
        'voting_location_id', 'section_id', 'year', 'round', 'qty_votes', 'vote_type',
        'created_at', 'updated_at',
    ];

    public function handle(): int
    {
        $ano = (int) $this->argument('ano');

        $total = DB::selectOne(
            'SELECT COUNT(*) AS total FROM public.votes WHERE year = ?',
            [$ano]
        )->total;

        if ($total === 0) {
            $this->warn("Nenhum registro encontrado em public.votes para o ano {$ano}.");
            return self::SUCCESS;
        }

        $this->info("Copiando {$total} voto(s) do ano {$ano} de public.votes → maps.votes...");

        /** @var PDO $pdo */
        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $columns        = implode(', ', self::COLUMNS);
        $colCount       = count(self::COLUMNS);
        $placeholderRow = '(' . implode(', ', array_fill(0, $colCount, '?')) . ')';

        $offset   = 0;
        $migrated = 0;

        do {
            $rows = DB::select(
                'SELECT ' . $columns . '
                 FROM public.votes
                 WHERE year = ?
                 ORDER BY id
                 LIMIT ? OFFSET ?',
                [$ano, self::CHUNK_SIZE, $offset]
            );

            if (empty($rows)) {
                break;
            }

            $placeholders = implode(', ', array_fill(0, count($rows), $placeholderRow));
            $sql          = "INSERT INTO maps.votes ({$columns}) VALUES {$placeholders}";

            $values = [];
            foreach ($rows as $row) {
                foreach (self::COLUMNS as $col) {
                    $values[] = $row->$col;
                }
            }

            $pdo->prepare($sql)->execute($values);

            $migrated += count($rows);
            $offset   += self::CHUNK_SIZE;

            $pct = round($migrated / $total * 100, 1);
            $this->info("Migrados: {$migrated} / {$total} ({$pct}%)");

        } while (count($rows) === self::CHUNK_SIZE);

        $this->info("Concluído: {$migrated} voto(s) copiados para maps.votes (ano {$ano}).");

        return self::SUCCESS;
    }
}
