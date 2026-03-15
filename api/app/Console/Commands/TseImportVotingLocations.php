<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\VotingLocation;
use App\Models\Zone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TseImportVotingLocations extends Command
{
    protected $signature = 'tse:import-voting-locations {--uf=} {--ano=}';

    protected $description = 'Importa locais de votação da staging tse_votacao_secao_2024 para a tabela voting_locations';

    public function handle(): int
    {
        $uf    = $this->option('uf');
        $ano   = $this->option('ano') ?: '2024';
        $table = "maps.tse_votacao_secao_{$ano}";

        $query = DB::table($table)
            ->selectRaw('DISTINCT cd_municipio, nr_zona, nr_local_votacao, nm_local_votacao, ds_local_votacao_endereco')
            ->orderBy('cd_municipio')
            ->orderBy('nr_zona')
            ->orderBy('nr_local_votacao');

        if ($uf) {
            $query->where('sg_uf', $uf);
        }

        $rows = $query->get();

        $this->info("Locais encontrados na staging: {$rows->count()}" . ($uf ? " (UF={$uf})" : '') . ($ano ? " (ANO={$ano})" : ''));

        $cityCache = [];
        $zoneCache = [];
        $created   = 0;
        $skipped   = 0;
        $processed = 0;

        foreach ($rows as $row) {
            $tseCode = $row->cd_municipio;

            // Resolver city_id
            if (! isset($cityCache[$tseCode])) {
                $city = City::where('tse_code', $tseCode)->first();
                $cityCache[$tseCode] = $city?->id;
            }

            $cityId = $cityCache[$tseCode];

            if (! $cityId) {
                $this->warn("  City não encontrada para cd_municipio={$tseCode}, pulando local {$row->nr_local_votacao}.");
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
                $this->warn("  Zone não encontrada para city_id={$cityId} zone_number={$row->nr_zona}, pulando local {$row->nr_local_votacao}.");
                $skipped++;
                $processed++;
                continue;
            }

            $location = VotingLocation::firstOrCreate(
                [
                    'zone_id'    => $zoneId,
                    'tse_number' => (int) $row->nr_local_votacao,
                ],
                [
                    'name'      => $row->nm_local_votacao,
                    'address'   => $row->ds_local_votacao_endereco,
                    'latitude'  => null,
                    'longitude' => null,
                ]
            );

            if ($location->wasRecentlyCreated) {
                $created++;
            } else {
                $skipped++;
            }

            $processed++;

            if ($processed % 5000 === 0) {
                $this->info("  {$processed} processados — {$created} criados, {$skipped} ignorados...");
            }
        }

        $this->info("Concluído: {$created} criados, {$skipped} ignorados.");

        return self::SUCCESS;
    }
}
