<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TseImportStateGeometry extends Command
{
    protected $signature = 'tse:import-state-geometry {uf}';

    protected $description = 'Importa o polígono GeoJSON do estado para a tabela states';

    public function handle(): int
    {
        $uf  = strtolower($this->argument('uf'));
        $url = "https://raw.githubusercontent.com/giuliano-macedo/geodata-br-states/main/geojson/br_states/br_{$uf}.json";

        $this->line("Buscando GeoJSON: {$url}");

        $json = @file_get_contents($url);

        if ($json === false) {
            $this->error("Falha ao buscar URL: {$url}");
            return self::FAILURE;
        }

        $updated = DB::table('states')
            ->where('uf', strtoupper($uf))
            ->update(['geometry' => $json]);

        if ($updated === 0) {
            $this->warn("Nenhum estado encontrado com UF=" . strtoupper($uf));
            return self::FAILURE;
        }

        $this->info("Geometry atualizada com sucesso para UF=" . strtoupper($uf));

        return self::SUCCESS;
    }
}
