<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CityController extends Controller
{
    public function zones(Request $request, int $cityId)
    {
        $candidacyId = $request->integer('candidacy_id') ?: null;

        if ($candidacyId) {
            $candidacy = \App\Models\Candidacy::findOrFail($candidacyId);
            $year = $candidacy->year;

            $zones = DB::connection('pgsql_maps')->select("
                SELECT z.id, z.zone_number, z.geometry,
                       COALESCE(SUM(v.qty_votes), 0) AS qty_votes
                FROM maps.zones z
                LEFT JOIN maps.votes v ON v.zone_id = z.id
                    AND v.candidacy_id = ?
                    AND v.vote_type = 'candidate'
                    AND v.year = ?
                    AND v.round = (SELECT MAX(round) FROM maps.votes WHERE candidacy_id = ? AND year = ?)
                WHERE z.city_id = ?
                GROUP BY z.id, z.zone_number, z.geometry::text
                ORDER BY qty_votes DESC, z.zone_number ASC
            ", [$candidacyId, $year, $candidacyId, $year, $cityId]);
        } else {
            $zones = DB::connection('pgsql_maps')
                ->table('maps.zones')
                ->select('id', 'zone_number', 'geometry')
                ->where('city_id', $cityId)
                ->orderBy('zone_number')
                ->get();
        }

        return response()->json(
            collect($zones)->map(fn ($z) => [
                'id'          => $z->id,
                'zone_number' => $z->zone_number,
                'qty_votes'   => $z->qty_votes ?? 0,
                'geometry'    => $z->geometry ? json_decode($z->geometry) : null,
            ])
        );
    }

    public function votingLocations(Request $request, int $cityId)
    {
        $candidacyId = $request->integer('candidacy_id') ?: null;
        $zoneId      = $request->integer('zone_id') ?: null;

        if ($candidacyId) {
            $candidacy = \App\Models\Candidacy::findOrFail($candidacyId);
            $year = $candidacy->year;
            $zoneFilter = $zoneId ? 'AND z.id = ?' : '';
            $bindings   = $zoneId
                ? [$candidacyId, $year, $candidacyId, $year, $cityId, $zoneId]
                : [$candidacyId, $year, $candidacyId, $year, $cityId];

            $rows = DB::connection('pgsql_maps')->select("
                SELECT vl.id, vl.name, vl.tse_number, vl.latitude, vl.longitude,
                       COALESCE(SUM(v.qty_votes), 0) AS qty_votes
                FROM maps.voting_locations vl
                JOIN maps.zones z ON z.id = vl.zone_id
                LEFT JOIN maps.votes v ON v.voting_location_id = vl.id
                    AND v.candidacy_id = ?
                    AND v.vote_type = 'candidate'
                    AND v.year = ?
                    AND v.round = (SELECT MAX(round) FROM maps.votes WHERE candidacy_id = ? AND year = ?)
                WHERE z.city_id = ? {$zoneFilter}
                GROUP BY vl.id, vl.name, vl.tse_number, vl.latitude, vl.longitude
                ORDER BY qty_votes DESC, vl.name ASC
            ", $bindings);
        } else {
            $query = DB::connection('pgsql_maps')
                ->table('maps.voting_locations as vl')
                ->join('maps.zones as z', 'z.id', '=', 'vl.zone_id')
                ->select('vl.id', 'vl.name', 'vl.tse_number', 'vl.latitude', 'vl.longitude')
                ->where('z.city_id', $cityId);
            if ($zoneId) $query->where('vl.zone_id', $zoneId);
            $rows = $query->orderBy('vl.name')->get();
        }

        return response()->json($rows);
    }

    public function search(Request $request)
    {
        $request->validate([
            'q'        => 'required|string|min:2',
            'state_id' => 'required|integer',
        ]);

        $q       = $request->input('q');
        $stateId = (int) $request->input('state_id');

        $cities = DB::connection('pgsql_maps')->table('maps.cities')
            ->select('id', 'name', 'ibge_code')
            ->where('state_id', $stateId)
            ->whereRaw("unaccent(name) ILIKE unaccent(?)", ["%{$q}%"])
            ->whereRaw("tse_code SIMILAR TO '[0-9]+'")
            ->orderBy('name')
            ->limit(10)
            ->get();

        return response()->json($cities);
    }
}
