<?php

namespace App\Http\Controllers;

use App\Models\Candidacy;
use App\Models\PeopleCandidacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CandidateController extends Controller
{
    public function index(Request $request)
    {
        $peopleCandidacies = PeopleCandidacy::with('candidacy.candidate', 'candidacy.party')
            ->where('people_id', $request->user()->people_id)
            ->where('active', true)
            ->orderBy('order')
            ->get();

        $candidates = $peopleCandidacies->map(function (PeopleCandidacy $pc) {
            $candidacy = $pc->candidacy;
            $candidate = $candidacy->candidate;
            return [
                'id'          => $candidacy->id,
                'name'        => $candidate->name,
                'ballot_name' => $candidacy->ballot_name,
                'role'        => $candidacy->role,
                'year'        => $candidacy->year,
                'status'      => $candidacy->status,
                'avatar_url'  => $candidate->photo_url,
                'party'       => [
                    'id'           => $candidacy->party->id,
                    'name'         => $candidacy->party->name,
                    'abbreviation' => $candidacy->party->abbreviation,
                ],
            ];
        });

        return response()->json($candidates);
    }

    public function search(Request $request)
    {
        $request->validate(['q' => 'required|string|min:2']);

        $tokens = array_values(array_filter(
            explode(' ', trim($request->input('q'))),
            fn ($t) => strlen($t) >= 2
        ));

        if (empty($tokens)) {
            return response()->json([]);
        }

        $user   = $request->user()->load('people');
        $people = $user->people;

        $query = Candidacy::query()
            ->select([
                'candidacies.id',
                'candidacies.sq_candidato',
                'candidacies.ballot_name',
                'candidacies.number as ballot_number',
                'candidacies.role',
                'candidacies.year',
                'candidacies.state_id',
                'candidates.name as candidate_name',
                'candidates.photo_url as photo_url',
                'parties.abbreviation as party_abbreviation',
                'cities.name as city_name',
                'states.uf as state_uf',
            ])
            ->join('candidates', 'candidates.id', '=', 'candidacies.candidate_id')
            ->join('parties',    'parties.id',    '=', 'candidacies.party_id')
            ->leftJoin('cities',  'cities.id',    '=', 'candidacies.city_id')
            ->leftJoin('states',  'states.id',    '=', 'candidacies.state_id');

        foreach ($tokens as $token) {
            $query->where(function ($w) use ($token) {
                $w->whereRaw('unaccent(candidacies.ballot_name) ILIKE unaccent(?)',  ["%{$token}%"])
                  ->orWhereRaw('unaccent(candidates.name) ILIKE unaccent(?)',        ["%{$token}%"])
                  ->orWhereRaw('unaccent(parties.abbreviation) ILIKE unaccent(?)',   ["%{$token}%"])
                  ->orWhereRaw('unaccent(cities.name) ILIKE unaccent(?)',            ["%{$token}%"])
                  ->orWhereRaw('CAST(candidacies.year AS TEXT) ILIKE ?',             ["%{$token}%"])
                  ->orWhereRaw('unaccent(candidacies.role) ILIKE unaccent(?)',       ["%{$token}%"]);
            });
        }

        if ($people->role !== 'admin') {
            $query->whereIn('candidacies.id', function ($sub) use ($people) {
                $sub->select('candidacy_id')
                    ->from('people_candidacies')
                    ->where('people_id', $people->id)
                    ->where('active', true);
            });
        }

        $results = $query->limit(10)->get()->map(fn ($row) => [
            'id'           => $row->id,
            'sq_candidato' => $row->sq_candidato,
            'name'         => $row->candidate_name,
            'ballot_name'   => $row->ballot_name,
            'ballot_number' => $row->ballot_number,
            'party'         => $row->party_abbreviation,
            'role'         => $row->role,
            'year'         => $row->year,
            'state_id'     => $row->state_id,
            'state_uf'     => $row->state_uf,
            'city'         => $row->city_name,
            'photo_url'    => $row->photo_url,
        ]);

        return response()->json($results);
    }

    public function stats(Request $request, int $id)
    {
        $candidacy = \App\Models\Candidacy::findOrFail($id);

        $stateRoles = [
            'DEPUTADO ESTADUAL', 'DEPUTADA ESTADUAL',
            'DEPUTADO FEDERAL',  'DEPUTADA FEDERAL',
            'SENADOR',           'SENADORA',
            'GOVERNADOR',        'GOVERNADORA',
        ];
        $isStateLevelRole = in_array(strtoupper($candidacy->role ?? ''), $stateRoles);

        // city_id do filtro (para cargos estaduais/federais o usuário pode filtrar por cidade)
        $filterCityId = $request->integer('city_id') ?: null;

        $rounds = DB::table('votes')
            ->where('candidacy_id', $id)
            ->orderBy('round')
            ->distinct()
            ->pluck('round')
            ->map(fn ($r) => (int) $r)
            ->values()
            ->all();

        if (empty($rounds)) {
            return response()->json([
                'rounds'        => [],
                'default_round' => null,
                'stats'         => (object) [],
            ]);
        }

        $stats = [];

        foreach ($rounds as $round) {
            // qty_votes do candidato (com filtro de cidade se informado)
            $qtyVotesQuery = DB::table('votes')
                ->where('candidacy_id', $id)
                ->where('round', $round);

            if ($filterCityId) {
                $qtyVotesQuery->where('city_id', $filterCityId);
            }

            $qtyVotes = (int) $qtyVotesQuery->sum('qty_votes');

            // Escopo: state_id ou city_id
            if ($filterCityId) {
                $scopeCol = 'v.city_id';
                $scopeVal = $filterCityId;
            } elseif ($isStateLevelRole) {
                $scopeCol = 'v.state_id';
                $scopeVal = $candidacy->state_id;
            } else {
                $scopeCol = 'v.city_id';
                $scopeVal = $candidacy->city_id;
            }

            // CTE única: totais do escopo + votos nominais do partido (Q2+Q3 em uma query)
            $scopeTotals = DB::selectOne("
                WITH scope_votes AS (
                    SELECT v.qty_votes, v.vote_type, c.party_id
                    FROM votes v
                    LEFT JOIN candidacies c ON c.id = v.candidacy_id
                    WHERE {$scopeCol} = ? AND v.round = ?
                )
                SELECT
                    SUM(CASE WHEN vote_type = 'candidate' THEN qty_votes ELSE 0 END)                          AS total_valid,
                    SUM(CASE WHEN vote_type = 'blank'     THEN qty_votes ELSE 0 END)                          AS qty_blank,
                    SUM(CASE WHEN vote_type = 'null'      THEN qty_votes ELSE 0 END)                          AS qty_null,
                    SUM(CASE WHEN vote_type = 'legend'    THEN qty_votes ELSE 0 END)                          AS qty_legend,
                    SUM(CASE WHEN vote_type IN ('candidate','blank','null') THEN qty_votes ELSE 0 END)         AS qty_total,
                    SUM(CASE WHEN vote_type = 'candidate' AND party_id = ? THEN qty_votes ELSE 0 END)         AS qty_party_nominal
                FROM scope_votes
            ", [$scopeVal, $round, $candidacy->party_id]);

            $totalValid      = (int) ($scopeTotals->total_valid      ?? 0);
            $qtyBlank        = (int) ($scopeTotals->qty_blank        ?? 0);
            $qtyNull         = (int) ($scopeTotals->qty_null         ?? 0);
            $qtyLegend       = (int) ($scopeTotals->qty_legend       ?? 0);
            $qtyTotal        = (int) ($scopeTotals->qty_total        ?? 0);
            $qtyPartyTotal   = (int) ($scopeTotals->qty_party_nominal ?? 0) + $qtyLegend;

            $percentage = $totalValid > 0
                ? round($qtyVotes / $totalValid * 100, 2)
                : 0.0;

            $stats[(string) $round] = [
                'qty_votes'       => $qtyVotes,
                'percentage'      => $percentage,
                'total_valid'     => $totalValid,
                'qty_blank'       => $qtyBlank,
                'qty_null'        => $qtyNull,
                'qty_legend'      => $qtyLegend,
                'qty_party_total' => $qtyPartyTotal,
                'qty_total'       => $qtyTotal,
                'status'          => $candidacy->status,
            ];
        }

        return response()->json([
            'rounds'        => $rounds,
            'default_round' => max($rounds),
            'stats'         => $stats,
        ]);
    }
}
