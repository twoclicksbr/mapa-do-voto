<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class TseImportVotacaoRaw extends Command
{
    protected $signature = 'tse:import-votacao-raw {file} {--uf=} {--ano=}';

    protected $description = 'Importa CSV de votação por seção do TSE para tse_votacao_secao_{ano} (staging, cópia fiel)';

    private const CHUNK_SIZE = 2000;

    private const DB_COLUMNS = [
        'dt_geracao',
        'hh_geracao',
        'ano_eleicao',
        'cd_tipo_eleicao',
        'nm_tipo_eleicao',
        'nr_turno',
        'cd_eleicao',
        'ds_eleicao',
        'dt_eleicao',
        'tp_abrangencia',
        'sg_uf',
        'sg_ue',
        'nm_ue',
        'cd_municipio',
        'nm_municipio',
        'nr_zona',
        'nr_secao',
        'cd_cargo',
        'ds_cargo',
        'nr_votavel',
        'nm_votavel',
        'qt_votos',
        'nr_local_votacao',
        'sq_candidato',
        'nm_local_votacao',
        'ds_local_votacao_endereco',
    ];

    public function handle(): int
    {
        $file  = $this->argument('file');
        $uf    = $this->option('uf');
        $ano   = $this->option('ano') ?: '2024';
        $table = "tse_votacao_secao_{$ano}";

        if (! file_exists($file)) {
            $this->error("Arquivo não encontrado: {$file}");
            return self::FAILURE;
        }

        $handle = fopen($file, 'r');
        if (! $handle) {
            $this->error("Não foi possível abrir o arquivo.");
            return self::FAILURE;
        }

        $this->info("Iniciando importação → {$table}" . ($uf ? " UF={$uf}" : '') . "...");

        /** @var PDO $pdo */
        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Lê header e monta mapa lowercase → índice
        $rawHeader = fgetcsv($handle, 0, ';', '"');
        $header    = array_map(
            fn($v) => strtolower(mb_convert_encoding(trim($v), 'UTF-8', 'ISO-8859-1')),
            $rawHeader
        );
        $colMap = array_flip($header);

        $chunk      = [];
        $totalLines = 0;
        $startTime  = microtime(true);

        while (($row = fgetcsv($handle, 0, ';', '"')) !== false) {
            $row = array_map(fn($v) => mb_convert_encoding($v, 'UTF-8', 'ISO-8859-1'), $row);

            $record = [];
            foreach (self::DB_COLUMNS as $col) {
                $record[$col] = isset($colMap[$col]) ? ($row[$colMap[$col]] ?? null) : null;
            }

            $chunk[] = $record;

            if (count($chunk) >= self::CHUNK_SIZE) {
                $this->bulkInsert($pdo, $chunk, $table);
                $totalLines += count($chunk);
                $chunk = [];

                $elapsed = round(microtime(true) - $startTime, 1);
                $this->info("  {$totalLines} linhas inseridas ({$elapsed}s)...");
            }
        }

        fclose($handle);

        if (! empty($chunk)) {
            $this->bulkInsert($pdo, $chunk, $table);
            $totalLines += count($chunk);
        }

        $elapsed = round(microtime(true) - $startTime, 1);
        $this->info("Concluído: {$totalLines} linhas inseridas em {$elapsed}s.");

        return self::SUCCESS;
    }

    private function bulkInsert(PDO $pdo, array $rows, string $table): void
    {
        $columns        = implode(', ', self::DB_COLUMNS);
        $colCount       = count(self::DB_COLUMNS);
        $placeholderRow = '(' . implode(', ', array_fill(0, $colCount, '?')) . ')';
        $placeholders   = implode(', ', array_fill(0, count($rows), $placeholderRow));

        $sql = "INSERT INTO {$table} ({$columns}) VALUES {$placeholders}";

        $values = [];
        foreach ($rows as $row) {
            foreach (self::DB_COLUMNS as $col) {
                $values[] = $row[$col];
            }
        }

        $pdo->prepare($sql)->execute($values);
    }
}
