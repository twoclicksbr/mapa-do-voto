<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class TseImportVotacao extends Command
{
    protected $signature = 'tse:import-votacao {file} {--uf=SP} {--ano=2024}';

    protected $description = 'Importa CSV de votação por seção do TSE — popula cities, candidates e tse_votacao_secao';

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

        $hasParties = isset($colMap['NM_PARTIDO']) && isset($colMap['SG_PARTIDO']);

        $votacaoChunk    = [];
        $citiesBuffer    = [];   // tse_code => row
        $candidatesBuffer = [];  // sq_candidato => row
        $partiesBuffer   = [];   // abbreviation => row

        $totalLines = 0;
        $startTime  = microtime(true);

        while (($row = fgetcsv($handle, 0, ';', '"')) !== false) {
            $row = array_map(
                fn($v) => mb_convert_encoding($v, 'UTF-8', 'ISO-8859-1'),
                $row
            );

            $col = fn(string $name) => $row[$colMap[$name]] ?? null;

            // --- PARTIES ---
            if ($hasParties) {
                $sgPartido = $this->str($col('SG_PARTIDO'));
                $nmPartido = $this->str($col('NM_PARTIDO'));
                if ($sgPartido && ! isset($partiesBuffer[$sgPartido])) {
                    $partiesBuffer[$sgPartido] = [
                        'abbreviation' => $sgPartido,
                        'name'         => $nmPartido ?? $sgPartido,
                    ];
                }
            }

            // --- CITIES ---
            $cdMunicipio = $this->num($col('CD_MUNICIPIO'));
            $nmMunicipio = $this->str($col('NM_MUNICIPIO'));
            $sgUf        = $this->str($col('SG_UF')) ?? $uf;

            if ($cdMunicipio && ! isset($citiesBuffer[$cdMunicipio])) {
                $citiesBuffer[$cdMunicipio] = [
                    'tse_code' => $cdMunicipio,
                    'name'     => $nmMunicipio,
                    'sg_uf'    => $sgUf,
                ];
            }

            // --- CANDIDATES ---
            $sqCandidato  = $this->num($col('SQ_CANDIDATO'));
            $nmVotavel    = $this->str($col('NM_VOTAVEL'));
            $cdCargo      = $this->num($col('CD_CARGO'));
            $dsCargo      = $this->str($col('DS_CARGO')) ?? '';

            if ($sqCandidato && ! isset($candidatesBuffer[$sqCandidato])) {
                $candidatesBuffer[$sqCandidato] = [
                    'sq_candidato' => $sqCandidato,
                    'name'         => $nmVotavel ?? '',
                    'ballot_name'  => $nmVotavel,
                    'cd_municipio' => $cdMunicipio,
                    'state'        => $sgUf,
                    'year'         => $ano,
                    'role'         => $dsCargo,
                ];
            }

            // --- TSE_VOTACAO_SECAO ---
            $votacaoChunk[] = [
                'ano_eleicao'  => $this->num($col('ANO_ELEICAO')) ?? $ano,
                'nr_turno'     => $this->num($col('NR_TURNO')),
                'sg_uf'        => $sgUf,
                'cd_municipio' => $cdMunicipio,
                'nr_zona'      => $this->num($col('NR_ZONA')),
                'nr_secao'     => $this->num($col('NR_SECAO')),
                'cd_cargo'     => $cdCargo,
                'sq_candidato' => $sqCandidato,
                'qt_votos'     => $this->num($col('QT_VOTOS')),
            ];

            if (count($votacaoChunk) >= self::CHUNK_SIZE) {
                $this->flushParties($pdo, $partiesBuffer);
                $this->flushCities($pdo, $citiesBuffer);
                $this->flushCandidates($pdo, $candidatesBuffer);
                $this->bulkInsertVotacao($pdo, $votacaoChunk);

                $totalLines += count($votacaoChunk);
                $votacaoChunk     = [];
                $citiesBuffer     = [];
                $candidatesBuffer = [];
                $partiesBuffer    = [];

                if ($totalLines % 100_000 === 0) {
                    $elapsed = round(microtime(true) - $startTime, 1);
                    $this->info("{$totalLines} linhas processadas ({$elapsed}s)...");
                }
            }
        }

        fclose($handle);

        if (! empty($votacaoChunk)) {
            $this->flushParties($pdo, $partiesBuffer);
            $this->flushCities($pdo, $citiesBuffer);
            $this->flushCandidates($pdo, $candidatesBuffer);
            $this->bulkInsertVotacao($pdo, $votacaoChunk);
            $totalLines += count($votacaoChunk);
        }

        $elapsed = round(microtime(true) - $startTime, 1);
        $this->info("Concluído: {$totalLines} linhas em {$elapsed}s.");

        return self::SUCCESS;
    }

    // -------------------------------------------------------------------------
    // Flush helpers
    // -------------------------------------------------------------------------

    private function flushParties(PDO $pdo, array $buffer): void
    {
        if (empty($buffer)) {
            return;
        }

        $placeholders = implode(', ', array_fill(0, count($buffer), '(?, ?)'));
        $sql = "INSERT INTO parties (abbreviation, name) VALUES {$placeholders}
                ON CONFLICT DO NOTHING";

        $values = [];
        foreach ($buffer as $row) {
            $values[] = $row['abbreviation'];
            $values[] = $row['name'];
        }

        $pdo->prepare($sql)->execute($values);
    }

    private function flushCities(PDO $pdo, array $buffer): void
    {
        if (empty($buffer)) {
            return;
        }

        $placeholders = implode(', ', array_fill(0, count($buffer), '(?, ?, ?)'));
        $sql = "INSERT INTO cities (tse_code, name, sg_uf) VALUES {$placeholders}
                ON CONFLICT (tse_code) DO NOTHING";

        $values = [];
        foreach ($buffer as $row) {
            $values[] = $row['tse_code'];
            $values[] = $row['name'];
            $values[] = $row['sg_uf'];
        }

        $pdo->prepare($sql)->execute($values);
    }

    private function flushCandidates(PDO $pdo, array $buffer): void
    {
        if (empty($buffer)) {
            return;
        }

        $placeholders = implode(', ', array_fill(0, count($buffer), '(gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?)'));
        $sql = "INSERT INTO candidates (uuid, sq_candidato, name, ballot_name, cd_municipio, state, year, role)
                VALUES {$placeholders}
                ON CONFLICT (sq_candidato) DO UPDATE SET ballot_name = EXCLUDED.ballot_name";

        $values = [];
        foreach ($buffer as $row) {
            $values[] = $row['sq_candidato'];
            $values[] = $row['name'];
            $values[] = $row['ballot_name'];
            $values[] = $row['cd_municipio'];
            $values[] = $row['state'];
            $values[] = $row['year'];
            $values[] = $row['role'];
        }

        $pdo->prepare($sql)->execute($values);
    }

    private function bulkInsertVotacao(PDO $pdo, array $rows): void
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

        $pdo->prepare($sql)->execute($values);
    }

    // -------------------------------------------------------------------------
    // Type helpers
    // -------------------------------------------------------------------------

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

}
