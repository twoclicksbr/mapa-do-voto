<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TseImportZoneGeometry extends Command
{
    protected $signature = 'tse:import-zone-geometry {uf} {ano}';

    protected $description = 'Importa geometrias de zonas eleitorais de um arquivo GeoJSON para maps.zones';

    public function handle(): int
    {
        $uf  = strtolower($this->argument('uf'));
        $ano = $this->argument('ano');

        $file = base_path("../tse/zona-eleitoral/zones_{$uf}_{$ano}.geojson");

        if (!file_exists($file)) {
            $this->error("Arquivo não encontrado: {$file}");
            return self::FAILURE;
        }

        $this->line("Lendo: {$file}");

        $geojson  = json_decode(file_get_contents($file), true);
        $features = $geojson['features'] ?? [];
        $total    = count($features);

        if ($total === 0) {
            $this->error('Nenhuma feature encontrada no GeoJSON.');
            return self::FAILURE;
        }

        $this->line("Features encontradas: {$total}");

        // Cache cities by tse_code
        $cities = DB::connection('pgsql_maps')
            ->table('maps.cities')
            ->whereNotNull('tse_code')
            ->pluck('id', 'tse_code');

        $updated  = 0;
        $notFound = 0;
        $bar      = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($features as $feature) {
            $props   = $feature['properties'];
            $zeNum   = (string) $props['ze_num'];
            $cdMunT  = (int) $props['cd_mun_t'];
            $geometry = json_encode($feature['geometry']);

            $cityId = $cities->get($cdMunT);

            if (!$cityId) {
                $notFound++;
                $bar->advance();
                continue;
            }

            $rows = DB::connection('pgsql_maps')
                ->table('maps.zones')
                ->where('city_id', $cityId)
                ->where('zone_number', $zeNum)
                ->update(['geometry' => $geometry]);

            if ($rows > 0) {
                $updated++;
            } else {
                $notFound++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Zonas atualizadas: {$updated}");

        if ($notFound > 0) {
            $this->warn("Não encontradas (sem match): {$notFound}");
        }

        return self::SUCCESS;
    }
}
