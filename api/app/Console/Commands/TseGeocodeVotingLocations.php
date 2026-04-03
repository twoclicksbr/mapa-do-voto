<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class TseGeocodeVotingLocations extends Command
{
    protected $signature = 'tse:geocode-voting-locations
                            {--uf= : Filtrar por UF (ex: SP)}
                            {--limit=0 : Limite de registros a processar (0 = todos)}
                            {--concurrency=10 : Requests paralelos por lote}
                            {--fix-duplicates : Regeocodifica duplicatas usando nome do colégio}';

    protected $description = 'Geocodifica voting_locations sem coordenadas via Google Maps Geocoding API';

    public function handle(): int
    {
        $apiKey = config('services.google.maps_key');

        if (! $apiKey) {
            $this->error('GOOGLE_MAPS_KEY não configurado no .env');
            return self::FAILURE;
        }

        $uf            = $this->option('uf');
        $limit         = (int) $this->option('limit');
        $concurrency   = max(1, (int) $this->option('concurrency'));
        $fixDuplicates = $this->option('fix-duplicates');

        if ($fixDuplicates) {
            $rows = $this->loadDuplicates($uf, $limit);
        } else {
            $rows = $this->loadWithoutCoords($uf, $limit);
        }

        if ($rows->isEmpty()) {
            $this->info('Nenhum registro encontrado.');
            return self::SUCCESS;
        }

        $total = $rows->count();
        $mode  = $fixDuplicates ? 'pelo nome do colégio' : 'pelo endereço';
        $this->info("Geocodificando {$total} locais {$mode}" . ($uf ? " (UF={$uf})" : '') . " (concorrência: {$concurrency})...");

        $bar      = $this->output->createProgressBar($total);
        $success  = 0;
        $failed   = 0;
        $noResult = 0;

        $bar->start();

        foreach ($rows->chunk($concurrency) as $batch) {
            $responses = Http::pool(function ($pool) use ($batch, $apiKey, $fixDuplicates) {
                foreach ($batch as $row) {
                    $address = $fixDuplicates
                        ? "{$row->name}, {$row->city_name}, {$row->uf}, Brasil"
                        : "{$row->address}, {$row->city_name}, {$row->uf}, Brasil";

                    $pool->as($row->id)->timeout(15)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                        'address' => $address,
                        'key'     => $apiKey,
                        'region'  => 'br',
                    ]);
                }
            });

            $updates = [];

            foreach ($batch as $row) {
                $response = $responses[$row->id];

                if ($response instanceof \Throwable) {
                    $failed++;
                    $bar->advance();
                    continue;
                }

                $data = $response->json();

                if ($data['status'] === 'OK' && ! empty($data['results'])) {
                    $loc       = $data['results'][0]['geometry']['location'];
                    $updates[] = ['id' => $row->id, 'lat' => $loc['lat'], 'lng' => $loc['lng']];
                    $success++;
                } elseif ($data['status'] === 'ZERO_RESULTS') {
                    $noResult++;
                } else {
                    $failed++;
                }

                $bar->advance();
            }

            foreach ($updates as $u) {
                DB::connection('pgsql_maps')
                    ->table('maps.voting_locations')
                    ->where('id', $u['id'])
                    ->update(['latitude' => $u['lat'], 'longitude' => $u['lng'], 'updated_at' => now()]);
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info("Concluído: {$success} atualizados, {$noResult} sem resultado, {$failed} erros.");

        return self::SUCCESS;
    }

    private function loadWithoutCoords(string $uf = null, int $limit = 0)
    {
        $query = DB::connection('pgsql_maps')
            ->table('maps.voting_locations as vl')
            ->join('maps.zones as z', 'z.id', '=', 'vl.zone_id')
            ->join('maps.cities as c', 'c.id', '=', 'z.city_id')
            ->join('maps.states as s', 's.id', '=', 'c.state_id')
            ->whereNull('vl.latitude')
            ->select(['vl.id', 'vl.name', 'vl.address', 'c.name as city_name', 's.uf'])
            ->orderBy('vl.id');

        if ($uf) $query->where('s.uf', strtoupper($uf));
        if ($limit > 0) $query->limit($limit);

        return $query->get();
    }

    private function loadDuplicates(string $uf = null, int $limit = 0)
    {
        // Busca todos os registros cujas coordenadas aparecem mais de uma vez
        $query = DB::connection('pgsql_maps')
            ->table('maps.voting_locations as vl')
            ->join('maps.zones as z', 'z.id', '=', 'vl.zone_id')
            ->join('maps.cities as c', 'c.id', '=', 'z.city_id')
            ->join('maps.states as s', 's.id', '=', 'c.state_id')
            ->whereNotNull('vl.latitude')
            ->whereRaw('(SELECT COUNT(*) FROM maps.voting_locations vl2 WHERE vl2.latitude = vl.latitude AND vl2.longitude = vl.longitude) > 1')
            ->select(['vl.id', 'vl.name', 'vl.address', 'c.name as city_name', 's.uf'])
            ->orderBy('vl.id');

        if ($uf) $query->where('s.uf', strtoupper($uf));
        if ($limit > 0) $query->limit($limit);

        return $query->get();
    }
}
