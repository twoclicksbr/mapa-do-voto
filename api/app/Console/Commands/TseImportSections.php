<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\Section;
use App\Models\VotingLocation;
use App\Models\Zone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TseImportSections extends Command
{
    protected $signature = 'tse:import-sections {--uf=} {--ano=}';

    protected $description = 'Importa seções eleitorais da staging tse_votacao_secao_2024 para a tabela sections';

    public function handle(): int
    {
        $uf    = $this->option('uf');
        $ano   = $this->option('ano') ?: '2024';
        $table = "tse_votacao_secao_{$ano}";

        $query = DB::table($table)
            ->selectRaw('DISTINCT cd_municipio, nr_zona, nr_local_votacao, nr_secao')
            ->orderBy('cd_municipio')
            ->orderBy('nr_zona')
            ->orderBy('nr_local_votacao')
            ->orderBy('nr_secao');

        if ($uf) {
            $query->where('sg_uf', $uf);
        }

        $rows = $query->get();

        $this->info("Seções encontradas na staging: {$rows->count()}" . ($uf ? " (UF={$uf})" : '') . ($ano ? " (ANO={$ano})" : ''));

        $cityCache     = [];
        $zoneCache     = [];
        $locationCache = [];
        $created       = 0;
        $skipped       = 0;
        $processed     = 0;

        foreach ($rows as $row) {
            $tseCode = $row->cd_municipio;

            // Resolver city_id
            if (! isset($cityCache[$tseCode])) {
                $city = City::where('tse_code', $tseCode)->first();
                $cityCache[$tseCode] = $city?->id;
            }

            $cityId = $cityCache[$tseCode];

            if (! $cityId) {
                $this->warn("  City não encontrada para cd_municipio={$tseCode}, pulando seção {$row->nr_secao}.");
                $skipped++;
                $processed++;
                continue;
            }

            // Resolver zone_id
            $zoneCacheKey = "{$cityId}:{$row->nr_zona}";

            if (! isset($zoneCache[$zoneCacheKey])) {
                $zone = Zone::where('city_id', $cityId)
                    ->where('zone_number', (int) $row->nr_zona)
                    ->first();
                $zoneCache[$zoneCacheKey] = $zone?->id;
            }

            $zoneId = $zoneCache[$zoneCacheKey];

            if (! $zoneId) {
                $this->warn("  Zone não encontrada para city_id={$cityId} zone_number={$row->nr_zona}, pulando seção {$row->nr_secao}.");
                $skipped++;
                $processed++;
                continue;
            }

            // Resolver voting_location_id
            $locationCacheKey = "{$zoneId}:{$row->nr_local_votacao}";

            if (! isset($locationCache[$locationCacheKey])) {
                $location = VotingLocation::where('zone_id', $zoneId)
                    ->where('tse_number', (int) $row->nr_local_votacao)
                    ->first();
                $locationCache[$locationCacheKey] = $location?->id;
            }

            $votingLocationId = $locationCache[$locationCacheKey];

            if (! $votingLocationId) {
                $this->warn("  VotingLocation não encontrada para zone_id={$zoneId} tse_number={$row->nr_local_votacao}, pulando seção {$row->nr_secao}.");
                $skipped++;
                $processed++;
                continue;
            }

            $section = Section::firstOrCreate(
                [
                    'voting_location_id' => $votingLocationId,
                    'section_number'     => (int) $row->nr_secao,
                ]
            );

            if ($section->wasRecentlyCreated) {
                $created++;
            } else {
                $skipped++;
            }

            $processed++;

            if ($processed % 5000 === 0) {
                $this->info("  {$processed} processadas — {$created} criadas, {$skipped} ignoradas...");
            }
        }

        $this->info("Concluído: {$created} criadas, {$skipped} ignoradas.");

        return self::SUCCESS;
    }
}
