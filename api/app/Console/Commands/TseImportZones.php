<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\Zone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TseImportZones extends Command
{
    protected $signature = 'tse:import-zones {--uf=} {--ano=}';

    protected $description = 'Importa zonas eleitorais da staging tse_votacao_secao_2024 para a tabela zones';

    public function handle(): int
    {
        $uf    = $this->option('uf');
        $ano   = $this->option('ano') ?: '2024';
        $table = "tse_votacao_secao_{$ano}";

        $query = DB::table($table)
            ->selectRaw('DISTINCT cd_municipio, nr_zona')
            ->orderBy('cd_municipio')
            ->orderBy('nr_zona');

        if ($uf) {
            $query->where('sg_uf', $uf);
        }

        $rows = $query->get();

        $this->info("Zonas encontradas na staging: {$rows->count()}" . ($uf ? " (UF={$uf})" : '') . ($ano ? " (ANO={$ano})" : ''));

        $cityCache = [];
        $created   = 0;
        $skipped   = 0;
        $processed = 0;

        foreach ($rows as $row) {
            $tsCode = $row->cd_municipio;

            if (! isset($cityCache[$tsCode])) {
                $city = City::where('tse_code', $tsCode)->first();
                $cityCache[$tsCode] = $city?->id;
            }

            $cityId = $cityCache[$tsCode];

            if (! $cityId) {
                $this->warn("  City não encontrada para cd_municipio={$tsCode}, pulando zona {$row->nr_zona}.");
                $skipped++;
                $processed++;
                continue;
            }

            $zone = Zone::firstOrCreate(
                [
                    'city_id'     => $cityId,
                    'zone_number' => (int) $row->nr_zona,
                ],
                [
                    'geometry' => null,
                ]
            );

            if ($zone->wasRecentlyCreated) {
                $created++;
            } else {
                $skipped++;
            }

            $processed++;

            if ($processed % 1000 === 0) {
                $this->info("  {$processed} processadas — {$created} criadas, {$skipped} ignoradas...");
            }
        }

        $this->info("Concluído: {$created} criadas, {$skipped} ignoradas.");

        return self::SUCCESS;
    }
}
