<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class TseImportVotacao extends Command
{
    protected $signature = 'tse:import-votacao {file} {--uf=SP} {--ano=2024}';

    protected $description = 'Importa CSV de votação por seção do TSE para a tabela tse_votacao_secao';

    private const CHUNK_SIZE = 3000;
    private const NULL_VALUES = ['#NULO', '#NULO#', ''];
    private const NULL_NUMERIC = ['-1', '-3'];

    public function handle(): int
    {
        $file = $this->argument('file');
        $uf   = strtoupper($this->option('uf'));
        $ano  = (int) $this->option('ano');

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

        // Lê o header e cria mapa nome → índice
        $headerRaw = fgetcsv($handle, 0, ';', '"');
        $headerRaw = array_map(fn($v) => mb_convert_encoding(trim($v), 'UTF-8', 'ISO-8859-1'), $headerRaw);
        $colMap = array_flip($headerRaw);

        $chunk       = [];
        $totalLines  = 0;
        $startTime   = microtime(true);

        while (($row = fgetcsv($handle, 0, ';', '"')) !== false) {
            $row = array_map(
                fn($v) => mb_convert_encoding($v, 'UTF-8', 'ISO-8859-1'),
                $row
            );

            $chunk[] = $this->mapRow($row, $colMap, $uf, $ano);

            if (count($chunk) >= self::CHUNK_SIZE) {
                $this->bulkInsert($pdo, $chunk);
                $totalLines += count($chunk);
                $chunk = [];

                if ($totalLines % 100_000 === 0) {
                    $elapsed = round(microtime(true) - $startTime, 1);
                    $this->info("{$totalLines} linhas inseridas ({$elapsed}s)...");
                }
            }
        }

        fclose($handle);

        if (! empty($chunk)) {
            $this->bulkInsert($pdo, $chunk);
            $totalLines += count($chunk);
        }

        $elapsed = round(microtime(true) - $startTime, 1);
        $this->info("Concluído: {$totalLines} linhas inseridas em {$elapsed}s.");

        return self::SUCCESS;
    }

    private function mapRow(array $row, array $colMap, string $uf, int $ano): array
    {
        $col = fn(string $name) => $row[$colMap[$name]] ?? null;

        return [
            'ano_eleicao'      => $this->str($col('ANO_ELEICAO')) ?? $ano,
            'nr_turno'         => $this->num($col('NR_TURNO')),
            'cd_eleicao'       => $this->num($col('CD_ELEICAO')),
            'sg_uf'            => $this->str($col('SG_UF')) ?? $uf,
            'cd_municipio'     => $this->num($col('CD_MUNICIPIO')),
            'nm_municipio'     => $this->str($col('NM_MUNICIPIO')),
            'nr_zona'          => $this->num($col('NR_ZONA')),
            'nr_secao'         => $this->num($col('NR_SECAO')),
            'cd_cargo'         => $this->num($col('CD_CARGO')),
            'ds_cargo'         => $this->str($col('DS_CARGO')),
            'sq_candidato'     => $this->num($col('SQ_CANDIDATO')),
            'nr_votavel'       => $this->str($col('NR_VOTAVEL')),
            'nm_votavel'       => $this->str($col('NM_VOTAVEL')),
            'qt_votos'         => $this->num($col('QT_VOTOS')),
            'nr_local_votacao' => $this->num($col('NR_LOCAL_VOTACAO')),
            'nm_local_votacao' => $this->str($col('NM_LOCAL_VOTACAO')),
        ];
    }

    private function str(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = trim($value);
        return in_array($value, self::NULL_VALUES, true) ? null : $value;
    }

    private function num(?string $value): ?int
    {
        if ($value === null) {
            return null;
        }
        $value = trim($value);
        if (in_array($value, self::NULL_VALUES, true) || in_array($value, self::NULL_NUMERIC, true)) {
            return null;
        }
        return (int) $value;
    }

    private function bulkInsert(PDO $pdo, array $rows): void
    {
        $columns = implode(', ', array_keys($rows[0]));
        $colCount = count($rows[0]);

        $placeholderRow = '(' . implode(', ', array_fill(0, $colCount, '?')) . ')';
        $placeholders   = implode(', ', array_fill(0, count($rows), $placeholderRow));

        $sql    = "INSERT INTO tse_votacao_secao ({$columns}) VALUES {$placeholders}";
        $values = [];

        foreach ($rows as $row) {
            foreach ($row as $value) {
                $values[] = $value;
            }
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
    }
}
