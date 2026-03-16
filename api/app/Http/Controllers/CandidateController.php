<?php

namespace App\Http\Controllers;

use App\Models\Candidacy;
use App\Models\PeopleCandidacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CandidateController extends Controller
{
    private function isMaster(Request $request): bool
    {
        $parts = explode('.', $request->getHost());
        return count($parts) > 1 && $parts[0] === 'master';
    }

    public function index(Request $request)
    {
        $format = fn ($candidacy) => [
            'id'             => $candidacy->id,
            'name'           => $candidacy->candidate->name,
            'ballot_name'    => $candidacy->ballot_name,
            'role'           => $candidacy->role,
            'year'           => $candidacy->year,
            'status'         => $candidacy->status,
            'avatar_url'     => $candidacy->candidate->photo_url,
            'state_uf'       => $candidacy->state?->uf,
            'city_id'        => $candidacy->city_id,
            'city_name'      => $candidacy->city?->name,
            'city_ibge_code' => $candidacy->city?->ibge_code,
            'party'          => [
                'id'           => $candidacy->party->id,
                'name'         => $candidacy->party->name,
                'abbreviation' => $candidacy->party->abbreviation,
            ],
        ];

        if ($this->isMaster($request)) {
            $candidacies = Candidacy::with(['candidate', 'party', 'state', 'city'])
                ->orderBy('id')
                ->get();

            return response()->json($candidacies->map($format));
        }

        $peopleCandidacies = PeopleCandidacy::with([
            'candidacy.candidate',
            'candidacy.party',
            'candidacy.state',
            'candidacy.city',
        ])
            ->where('people_id', $request->user()->people_id)
            ->where('active', true)
            ->orderBy('order')
            ->get();

        return response()->json($peopleCandidacies->map(fn ($pc) => $format($pc->candidacy)));
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

        $bindings = [];
        $whereClauses = [];

        foreach ($tokens as $token) {
            $whereClauses[] = 'unaccent(name) ILIKE unaccent(?)';
            $bindings[] = "%{$token}%";
        }

        $where = implode(' AND ', $whereClauses);

        $rows = DB::select("
            SELECT id, name, photo_url
            FROM maps.candidates
            WHERE {$where}
            LIMIT 10
        ", $bindings);

        return response()->json(array_map(fn ($row) => [
            'id'       => $row->id,
            'name'     => $row->name,
            'photo_url' => $row->photo_url,
        ], $rows));
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

        $rounds = DB::table('maps.votes')
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
            $qtyVotesQuery = DB::table('maps.votes')
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

    public function cities(int $id)
    {
        $candidacy = \App\Models\Candidacy::findOrFail($id);

        if (!$candidacy->state_id) {
            return response()->json([]);
        }

        $cities = DB::select("
            SELECT c.id, c.name, c.ibge_code,
                   COALESCE(SUM(v.qty_votes), 0) AS qty_votes
            FROM cities c
            LEFT JOIN votes v ON v.city_id = c.id
                AND v.candidacy_id = ?
                AND v.vote_type = 'candidate'
                AND v.round = (SELECT MAX(round) FROM votes WHERE candidacy_id = ?)
            WHERE c.state_id = ?
              AND c.tse_code SIMILAR TO '[0-9]+'
            GROUP BY c.id, c.name, c.ibge_code
            ORDER BY qty_votes DESC, c.name ASC
        ", [$id, $id, $candidacy->state_id]);

        return response()->json($cities);
    }
}
