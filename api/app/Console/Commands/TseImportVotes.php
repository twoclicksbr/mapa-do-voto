<?php

namespace App\Console\Commands;

use App\Models\Candidacy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class TseImportVotes extends Command
{
    protected $signature = 'tse:import-votes {--uf=} {--ano=}';

    protected $description = 'Importa votos da staging tse_votacao_secao_2024 para a tabela votes';

    private const CHUNK_SIZE  = 2000;
    private const LOG_EVERY   = 100_000;
    private const COUNTRY_ID  = 1;

    private const INSERT_COLUMNS = [
        'candidacy_id',
        'country_id',
        'state_id',
        'city_id',
        'zone_id',
        'voting_location_id',
        'section_id',
        'year',
        'round',
        'qty_votes',
        'vote_type',
        'created_at',
        'updated_at',
    ];

    public function handle(): int
    {
        $uf    = $this->option('uf');
        $ano   = $this->option('ano') ?: '2024';
        $table = "tse_votacao_secao_{$ano}";

        /** @var PDO $pdo */
        $pdo = DB::connection()->getPdo();
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $this->info("Iniciando importação de votos" . ($uf ? " UF={$uf}" : '') . ($ano ? " ANO={$ano}" : '') . "...");

        // Limpar apenas o ano importado
        DB::statement("DELETE FROM votes WHERE year = {$ano}");
        $this->info("Votos do ano {$ano} removidos.");

        // Pré-carregar candidacies: sq_candidato → [id, state_id]
        $this->info("Carregando candidacies...");
        $candidacyCache = [];
        Candidacy::whereNotNull('sq_candidato')
            ->select('id', 'sq_candidato', 'state_id')
            ->each(function ($c) use (&$candidacyCache) {
                $candidacyCache[$c->sq_candidato] = ['id' => $c->id, 'state_id' => $c->state_id];
            });
        $this->info("  " . count($candidacyCache) . " candidacies carregadas.");

        // Pré-carregar cities: tse_code → [id, state_id]
        $this->info("Carregando cities...");
        $cityCache = [];
        DB::table('maps.cities')->select('id', 'tse_code', 'state_id')->get()->each(function ($c) use (&$cityCache) {
            $cityCache[$c->tse_code] = ['id' => $c->id, 'state_id' => $c->state_id];
        });
        $this->info("  " . count($cityCache) . " cities carregadas.");

        // Pré-carregar zones
        $this->info("Carregando zones...");
        $zoneCache = [];
        DB::table('maps.zones')->select('id', 'city_id', 'zone_number')->orderBy('id')->each(function ($z) use (&$zoneCache) {
            $zoneCache["{$z->city_id}:{$z->zone_number}"] = $z->id;
        });
        $this->info("  " . count($zoneCache) . " zones carregadas.");

        // Pré-carregar voting_locations
        $this->info("Carregando voting_locations...");
        $locationCache = [];
        DB::table('maps.voting_locations')->select('id', 'zone_id', 'tse_number')->orderBy('id')->each(function ($l) use (&$locationCache) {
            $locationCache["{$l->zone_id}:{$l->tse_number}"] = $l->id;
        });
        $this->info("  " . count($locationCache) . " voting_locations carregadas.");

        // Pré-carregar sections
        $this->info("Carregando sections...");
        $sectionCache = [];
        DB::table('maps.sections')->select('id', 'voting_location_id', 'section_number')->orderBy('id')->each(function ($s) use (&$sectionCache) {
            $sectionCache["{$s->voting_location_id}:{$s->section_number}"] = $s->id;
        });
        $this->info("  " . count($sectionCache) . " sections carregadas.");

        $sql = "SELECT cd_municipio, nr_zona, nr_local_votacao, nr_secao,
                       sq_candidato, nr_votavel, ano_eleicao, nr_turno, qt_votos
                FROM {$table}";

        if ($uf) {
            $sql .= " WHERE sg_uf = " . $pdo->quote($uf);
        }

        $stmt = $pdo->query($sql);
        $stmt->setFetchMode(PDO::FETCH_ASSOC);

        $inserted  = 0;
        $ignored   = 0;
        $total     = 0;
        $batch     = [];
        $now       = now()->toDateTimeString();

        while ($row = $stmt->fetch()) {
            $total++;

            // 1. Resolver city
            $city = $cityCache[$row['cd_municipio']] ?? null;
            if (! $city) { $ignored++; goto next; }
            $cityId  = $city['id'];
            $stateId = $city['state_id'];

            // 2. Resolver zone_id
            $zoneId = $zoneCache["{$cityId}:{$row['nr_zona']}"] ?? null;
            if (! $zoneId) { $ignored++; goto next; }

            // 3. Resolver voting_location_id
            $votingLocationId = $locationCache["{$zoneId}:{$row['nr_local_votacao']}"] ?? null;
            if (! $votingLocationId) { $ignored++; goto next; }

            // 4. Resolver section_id
            $sectionId = $sectionCache["{$votingLocationId}:{$row['nr_secao']}"] ?? null;
            if (! $sectionId) { $ignored++; goto next; }

            // 5. Resolver candidacy e vote_type
            $candidacy = $candidacyCache[$row['sq_candidato']] ?? null;
            if ($candidacy) {
                $candidacyId = $candidacy['id'];
                $stateId     = $candidacy['state_id']; // state_id do candidato tem precedência
                $voteType    = 'candidate';
            } else {
                $candidacyId = null;
                $nr          = (int) $row['nr_votavel'];
                $voteType    = match ($nr) {
                    95      => 'blank',
                    96      => 'null',
                    default => 'legend',
                };
            }

            // 6. Acumular no batch
            $batch[] = [
                'candidacy_id'       => $candidacyId,
                'country_id'         => self::COUNTRY_ID,
                'state_id'           => $stateId,
                'city_id'            => $cityId,
                'zone_id'            => $zoneId,
                'voting_location_id' => $votingLocationId,
                'section_id'         => $sectionId,
                'year'               => (int) $row['ano_eleicao'],
                'round'              => (int) $row['nr_turno'],
                'qty_votes'          => (int) $row['qt_votos'],
                'vote_type'          => $voteType,
                'created_at'         => $now,
                'updated_at'         => $now,
            ];

            if (count($batch) >= self::CHUNK_SIZE) {
                $this->bulkInsert($pdo, $batch);
                $inserted += count($batch);
                $batch = [];
            }

            next:
            if ($total % self::LOG_EVERY === 0) {
                $this->info("  {$total} processadas — {$inserted} inseridas, {$ignored} ignoradas...");
            }
        }

        // Flush do batch restante
        if (! empty($batch)) {
            $this->bulkInsert($pdo, $batch);
            $inserted += count($batch);
        }

        $this->info("Concluído: {$inserted} inseridas, {$ignored} ignoradas. Total processado: {$total}.");

        return self::SUCCESS;
    }

    private function bulkInsert(PDO $pdo, array $rows): void
    {
        $columns        = implode(', ', self::INSERT_COLUMNS);
        $colCount       = count(self::INSERT_COLUMNS);
        $placeholderRow = '(' . implode(', ', array_fill(0, $colCount, '?')) . ')';
        $placeholders   = implode(', ', array_fill(0, count($rows), $placeholderRow));

        $sql = "INSERT INTO votes ({$columns}) VALUES {$placeholders}";

        $values = [];
        foreach ($rows as $row) {
            foreach (self::INSERT_COLUMNS as $col) {
                $values[] = $row[$col];
            }
        }

        $pdo->prepare($sql)->execute($values);
    }
}
