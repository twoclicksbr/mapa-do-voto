<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class TseImportRaw extends Command
{
    protected $signature = 'tse:import-raw {file}';

    protected $description = 'Importa CSV de votação por seção do TSE direto para tse_votacao_secao_raw (sem transformações)';

    private const CHUNK_SIZE = 2500;

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
        $file = $this->argument('file');

        if (! file_exists($file)) {
            $this->error("Arquivo não encontrado: {$file}");
            return self::FAILURE;
        }

        $handle = fopen($file, 'r');
        if (! $handle) {
            $this->error("Não foi possível abrir o arquivo.");
            return self::FAILURE;
        }

        /** @var PDO $pdo */
        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Lê header e cria mapa lowercase → índice
        $headerRaw = fgetcsv($handle, 0, ';', '"');
        $headerRaw = array_map(fn($v) => strtolower(mb_convert_encoding(trim($v), 'UTF-8', 'ISO-8859-1')), $headerRaw);
        $colMap = array_flip($headerRaw);

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
                $this->bulkInsert($pdo, $chunk);
                $totalLines += count($chunk);
                $chunk = [];

                if ($totalLines % 10_000 === 0) {
                    $elapsed = round(microtime(true) - $startTime, 1);
                    $this->info("{$totalLines} linhas processadas ({$elapsed}s)...");
                }
            }
        }

        fclose($handle);

        if (! empty($chunk)) {
            $this->bulkInsert($pdo, $chunk);
            $totalLines += count($chunk);
        }

        $elapsed = round(microtime(true) - $startTime, 1);
        $this->info("Concluído: {$totalLines} linhas em {$elapsed}s.");

        return self::SUCCESS;
    }

    private function bulkInsert(PDO $pdo, array $rows): void
    {
        $columns      = implode(', ', self::DB_COLUMNS);
        $colCount     = count(self::DB_COLUMNS);
        $placeholderRow = '(' . implode(', ', array_fill(0, $colCount, '?')) . ')';
        $placeholders   = implode(', ', array_fill(0, count($rows), $placeholderRow));

        $sql = "INSERT INTO tse_votacao_secao_raw ({$columns}) VALUES {$placeholders}
                ON CONFLICT ON CONSTRAINT tse_raw_unique DO NOTHING";

        $values = [];
        foreach ($rows as $row) {
            foreach (self::DB_COLUMNS as $col) {
                $values[] = $row[$col];
            }
        }

        $pdo->prepare($sql)->execute($values);
    }
}
