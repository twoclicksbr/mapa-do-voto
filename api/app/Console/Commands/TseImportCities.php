<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\State;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TseImportCities extends Command
{
    protected $signature = 'tse:import-cities {--uf=} {--ano=}';

    protected $description = 'Importa cidades da staging tse_votacao_secao_2024 para a tabela cities';

    public function handle(): int
    {
        $uf  = $this->option('uf');
        $ano = $this->option('ano');

        $query = DB::table('tse_votacao_secao_2024')
            ->selectRaw('DISTINCT cd_municipio, nm_municipio, sg_uf')
            ->orderBy('sg_uf')
            ->orderBy('nm_municipio');

        if ($uf) {
            $query->where('sg_uf', $uf);
        }

        $rows = $query->get();

        $this->info("Municípios encontrados na staging: {$rows->count()}" . ($uf ? " (UF={$uf})" : '') . ($ano ? " (ANO={$ano})" : ''));

        $stateCache = [];
        $created    = 0;
        $skipped    = 0;

        foreach ($rows as $row) {
            $sgUf = $row->sg_uf;

            if (! isset($stateCache[$sgUf])) {
                $state = State::where('uf', $sgUf)->first();
                $stateCache[$sgUf] = $state?->id;
            }

            $stateId = $stateCache[$sgUf];

            if (! $stateId) {
                $this->warn("  State não encontrado para UF={$sgUf}, pulando {$row->nm_municipio}.");
                $skipped++;
                continue;
            }

            $city = City::firstOrCreate(
                ['tse_code' => $row->cd_municipio],
                [
                    'state_id'  => $stateId,
                    'name'      => $row->nm_municipio,
                    'ibge_code' => null,
                    'geometry'  => null,
                ]
            );

            if ($city->wasRecentlyCreated) {
                $created++;
                $this->info("  [CRIADA] {$row->nm_municipio} ({$row->cd_municipio}) — {$sgUf}");
            } else {
                $skipped++;
                $this->line("  [IGNORADA] {$row->nm_municipio} ({$row->cd_municipio}) — já existe");
            }
        }

        $this->info("Concluído: {$created} criadas, {$skipped} ignoradas.");

        return self::SUCCESS;
    }
}
