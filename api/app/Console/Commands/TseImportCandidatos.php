<?php

namespace App\Console\Commands;

use App\Models\Candidacy;
use App\Models\Candidate;
use App\Models\City;
use App\Models\Gender;
use App\Models\Party;
use App\Models\State;
use Illuminate\Console\Command;

class TseImportCandidatos extends Command
{
    protected $signature = 'tse:import-candidatos {file} {--uf=} {--ano=}';

    protected $description = 'Importa CSV de candidatos do TSE para candidates e candidacies';

    public function handle(): int
    {
        $file = $this->argument('file');

        if (! file_exists($file)) {
            $this->error("Arquivo não encontrado: {$file}");
            return self::FAILURE;
        }

        $this->info("Iniciando importação: {$file}");

        // Caches em memória para evitar queries repetidas
        $genderCache    = Gender::pluck('id', 'description')->toArray();
        $partyCache     = Party::pluck('id', 'abbreviation')->toArray();
        $stateCache     = State::pluck('id', 'uf')->toArray();
        $cityCache      = []; // [tse_code => city_id]
        $candidateCache = []; // ["name|gender_id" => candidate_id]

        $totalCandidates  = 0;
        $totalCandidacies = 0;
        $totalSkipped     = 0;
        $chunkSize        = 500;
        $lineNumber       = 0;
        $chunk            = [];

        $handle = fopen($file, 'r');

        // Detectar e pular BOM se existir
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        // Ler e normalizar header
        $rawHeader = fgets($handle);
        $header = str_getcsv(
            mb_convert_encoding(trim($rawHeader), 'UTF-8', 'ISO-8859-1'),
            ';',
            '"'
        );
        $header = array_map(fn($col) => trim($col, " \t\n\r\0\x0B\""), $header);

        while (! feof($handle)) {
            $rawLine = fgets($handle);
            if ($rawLine === false || trim($rawLine) === '') {
                continue;
            }

            $line   = mb_convert_encoding($rawLine, 'UTF-8', 'ISO-8859-1');
            $fields = str_getcsv(trim($line), ';', '"');

            if (count($fields) < count($header)) {
                continue;
            }

            $row     = array_combine($header, array_slice($fields, 0, count($header)));
            $chunk[] = $row;
            $lineNumber++;

            if (count($chunk) >= $chunkSize) {
                [$created, $candidacies, $skipped] = $this->processChunk(
                    $chunk,
                    $genderCache,
                    $partyCache,
                    $stateCache,
                    $cityCache,
                    $candidateCache
                );

                $totalCandidates  += $created;
                $totalCandidacies += $candidacies;
                $totalSkipped     += $skipped;

                $this->line(sprintf(
                    '  Linha %d | candidates +%d | candidacies +%d | ignoradas %d',
                    $lineNumber,
                    $created,
                    $candidacies,
                    $skipped
                ));

                $chunk = [];
            }
        }

        // Processar chunk final
        if (! empty($chunk)) {
            [$created, $candidacies, $skipped] = $this->processChunk(
                $chunk,
                $genderCache,
                $partyCache,
                $stateCache,
                $cityCache,
                $candidateCache
            );

            $totalCandidates  += $created;
            $totalCandidacies += $candidacies;
            $totalSkipped     += $skipped;
        }

        fclose($handle);

        $this->newLine();
        $this->info('Importação concluída.');
        $this->table(
            ['Métrica', 'Total'],
            [
                ['Linhas processadas',               $lineNumber],
                ['Candidates criados',               $totalCandidates],
                ['Candidacies criadas',              $totalCandidacies],
                ['Candidacies ignoradas (dup sq)',   $totalSkipped],
            ]
        );

        return self::SUCCESS;
    }

    private function processChunk(
        array $chunk,
        array $genderCache,
        array $partyCache,
        array $stateCache,
        array &$cityCache,
        array &$candidateCache
    ): array {
        $created     = 0;
        $candidacies = 0;
        $skipped     = 0;

        foreach ($chunk as $row) {
            $sqCandidato = trim($row['SQ_CANDIDATO'] ?? '');

            // Ignorar linhas sem SQ_CANDIDATO válido
            if ($sqCandidato === '' || $sqCandidato === '-1') {
                $skipped++;
                continue;
            }

            // Candidacy já existe → pular
            if (Candidacy::where('sq_candidato', $sqCandidato)->exists()) {
                $skipped++;
                continue;
            }

            // --- Gender ---
            $dsGenero = trim($row['DS_GENERO'] ?? 'NÃO DIVULGÁVEL');
            if (! isset($genderCache[$dsGenero])) {
                $dsGenero = 'NÃO DIVULGÁVEL';
            }
            $genderId = $genderCache[$dsGenero] ?? null;

            // --- Candidate: firstOrCreate por nome + gender_id ---
            $nmCandidato = trim($row['NM_CANDIDATO'] ?? '');
            $cacheKey    = $nmCandidato . '|' . $genderId;

            if (isset($candidateCache[$cacheKey])) {
                $candidateId = $candidateCache[$cacheKey];
            } else {
                $candidate = Candidate::firstOrCreate(
                    ['name' => $nmCandidato, 'gender_id' => $genderId],
                    ['cpf' => null, 'photo_url' => null]
                );

                $candidateId               = $candidate->id;
                $candidateCache[$cacheKey] = $candidateId;

                if ($candidate->wasRecentlyCreated) {
                    $created++;
                }
            }

            // --- Party ---
            $sgPartido = trim($row['SG_PARTIDO'] ?? '');
            $partyId   = $partyCache[$sgPartido] ?? null;

            // --- State ---
            $sgUf    = trim($row['SG_UF'] ?? '');
            $stateId = $stateCache[$sgUf] ?? null;

            // --- City: firstOrCreate por tse_code ---
            $tseCode = trim($row['SG_UE'] ?? '');
            $nmUe    = trim($row['NM_UE'] ?? '');

            if (! isset($cityCache[$tseCode])) {
                $city               = City::firstOrCreate(
                    ['tse_code' => $tseCode],
                    ['state_id' => $stateId, 'name' => $nmUe]
                );
                $cityCache[$tseCode] = $city->id;
            }
            $cityId = $cityCache[$tseCode];

            // --- Status ---
            $status = trim($row['DS_SIT_TOT_TURNO'] ?? '');
            if ($status === '#NULO' || $status === '') {
                $status = null;
            }

            // --- Candidacy ---
            Candidacy::create([
                'sq_candidato' => $sqCandidato,
                'candidate_id' => $candidateId,
                'party_id'     => $partyId,
                'country_id'   => 1,
                'state_id'     => $stateId,
                'city_id'      => $cityId,
                'year'         => (int) ($row['ANO_ELEICAO'] ?? 0),
                'role'         => trim($row['DS_CARGO'] ?? ''),
                'ballot_name'  => trim($row['NM_URNA_CANDIDATO'] ?? ''),
                'number'       => (int) ($row['NR_CANDIDATO'] ?? 0),
                'status'       => $status,
            ]);

            $candidacies++;
        }

        return [$created, $candidacies, $skipped];
    }
}
