<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\Candidacy;
use App\Models\PeopleCandidacy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CandidateController extends Controller
{
    private function isMaster(Request $request): bool
    {
        $tenant = $request->attributes->get('tenant');
        if ($tenant) {
            return $tenant->slug === 'master';
        }
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
            'party'          => $candidacy->party ? [
                'id'           => $candidacy->party->id,
                'name'         => $candidacy->party->name,
                'abbreviation' => $candidacy->party->abbreviation,
            ] : null,
        ];

        if ($this->isMaster($request)) {
            return response()->json([]);
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

        // Cada token pode casar com qualquer campo (nome, cargo, ano, partido)
        // Todos os tokens devem casar (AND entre tokens, OR entre campos)
        $whereClauses = [];
        $tokenBindings = [];

        foreach ($tokens as $token) {
            $whereClauses[] = "(
                unaccent(cy.ballot_name) ILIKE unaccent(?)
                OR unaccent(cy.role)        ILIKE unaccent(?)
                OR p.abbreviation           ILIKE ?
                OR CAST(cy.year AS TEXT)    LIKE ?
                OR s.uf                     ILIKE ?
                OR unaccent(c.name)         ILIKE unaccent(?)
            )";
            $like = "%{$token}%";
            $tokenBindings[] = $like;
            $tokenBindings[] = $like;
            $tokenBindings[] = $like;
            $tokenBindings[] = $like;
            $tokenBindings[] = $like;
            $tokenBindings[] = $like;
        }

        $where = implode(' AND ', $whereClauses);

        if ($this->isMaster($request)) {
            $rows = DB::connection('pgsql_maps')->select("
                SELECT cy.id, cy.ballot_name AS name, cy.role, cy.year,
                       cy.state_id, s.uf AS state_uf,
                       cy.city_id, c.name AS city_name, c.ibge_code AS city_ibge_code,
                       p.abbreviation AS party,
                       ca.photo_url
                FROM maps.candidacies cy
                JOIN maps.candidates ca ON ca.id = cy.candidate_id
                JOIN maps.parties p     ON p.id  = cy.party_id
                LEFT JOIN maps.states s ON s.id  = cy.state_id
                LEFT JOIN maps.cities c ON c.id  = cy.city_id
                WHERE {$where}
                AND cy.role NOT ILIKE 'VICE-%'
                ORDER BY cy.year DESC, cy.ballot_name
                LIMIT 10
            ", $tokenBindings);
        } else {
            $peopleId = $request->user()->people_id;
            $candidacyIds = DB::table('gabinete_master.people_candidacies')
                ->where('people_id', $peopleId)
                ->where('active', true)
                ->pluck('candidacy_id')
                ->all();

            if (empty($candidacyIds)) {
                return response()->json([]);
            }

            $inList = implode(',', array_map('intval', $candidacyIds));
            $rows = DB::connection('pgsql_maps')->select("
                SELECT cy.id, cy.ballot_name AS name, cy.role, cy.year,
                       cy.state_id, s.uf AS state_uf,
                       cy.city_id, c.name AS city_name, c.ibge_code AS city_ibge_code,
                       p.abbreviation AS party,
                       ca.photo_url
                FROM maps.candidacies cy
                JOIN maps.candidates ca ON ca.id = cy.candidate_id
                JOIN maps.parties p     ON p.id  = cy.party_id
                LEFT JOIN maps.states s ON s.id  = cy.state_id
                LEFT JOIN maps.cities c ON c.id  = cy.city_id
                WHERE cy.id IN ({$inList}) AND {$where}
                AND cy.role NOT ILIKE 'VICE-%'
                ORDER BY cy.year DESC, cy.ballot_name
                LIMIT 10
            ", $tokenBindings);
        }

        return response()->json(array_map(fn ($row) => [
            'id'             => $row->id,
            'name'           => $row->name,
            'ballot_name'    => $row->name,
            'ballot_number'  => null,
            'role'           => $row->role,
            'year'           => $row->year,
            'state_id'       => $row->state_id,
            'state_uf'       => $row->state_uf,
            'city_id'        => $row->city_id,
            'city'           => $row->city_name,
            'city_ibge_code' => $row->city_ibge_code,
            'party'          => $row->party,
            'photo_url'      => $row->photo_url,
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

        $filterCityId = $request->integer('city_id') ?: null;

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

        // candidate_by_round: quando filterCityId, limita votos do candidato à cidade filtrada
        $candidateCityFilter = $filterCityId ? 'AND city_id = ?' : '';
        $candidateBindings   = $filterCityId
            ? [$id, $candidacy->year, $filterCityId]
            : [$id, $candidacy->year];

        // Query única: candidate_by_round + scope_by_round em um único pass
        // year filter ativa partition pruning na tabela particionada
        $rows = DB::connection('pgsql_maps')->select("
            WITH candidate_by_round AS (
                SELECT round, SUM(qty_votes) AS qty_votes
                FROM maps.votes
                WHERE candidacy_id = ? AND year = ? {$candidateCityFilter}
                GROUP BY round
            ),
            scope_by_round AS (
                SELECT v.round,
                    SUM(CASE WHEN v.vote_type = 'candidate' THEN v.qty_votes ELSE 0 END)                             AS total_valid,
                    SUM(CASE WHEN v.vote_type = 'blank'     THEN v.qty_votes ELSE 0 END)                             AS qty_blank,
                    SUM(CASE WHEN v.vote_type = 'null'      THEN v.qty_votes ELSE 0 END)                             AS qty_null,
                    SUM(CASE WHEN v.vote_type = 'legend'    THEN v.qty_votes ELSE 0 END)                             AS qty_legend,
                    SUM(CASE WHEN v.vote_type IN ('candidate','blank','null') THEN v.qty_votes ELSE 0 END)            AS qty_total,
                    SUM(CASE WHEN v.vote_type = 'candidate' AND cy.party_id = ? THEN v.qty_votes ELSE 0 END)         AS qty_party_nominal
                FROM maps.votes v
                LEFT JOIN maps.candidacies cy ON cy.id = v.candidacy_id AND v.vote_type = 'candidate'
                WHERE {$scopeCol} = ? AND v.year = ?
                GROUP BY v.round
            )
            SELECT
                cbr.round,
                cbr.qty_votes,
                COALESCE(sbr.total_valid, 0)        AS total_valid,
                COALESCE(sbr.qty_blank, 0)          AS qty_blank,
                COALESCE(sbr.qty_null, 0)           AS qty_null,
                COALESCE(sbr.qty_legend, 0)         AS qty_legend,
                COALESCE(sbr.qty_total, 0)          AS qty_total,
                COALESCE(sbr.qty_party_nominal, 0)  AS qty_party_nominal
            FROM candidate_by_round cbr
            LEFT JOIN scope_by_round sbr ON sbr.round = cbr.round
            ORDER BY cbr.round
        ", array_merge($candidateBindings, [$candidacy->party_id, $scopeVal, $candidacy->year]));

        if (empty($rows)) {
            return response()->json([
                'rounds'        => [],
                'default_round' => null,
                'stats'         => (object) [],
            ]);
        }

        $stats  = [];
        $rounds = [];

        foreach ($rows as $row) {
            $round      = (int) $row->round;
            $rounds[]   = $round;
            $qtyVotes   = (int) $row->qty_votes;
            $totalValid = (int) $row->total_valid;
            $qtyLegend  = (int) $row->qty_legend;

            $stats[(string) $round] = [
                'qty_votes'       => $qtyVotes,
                'percentage'      => $totalValid > 0 ? round($qtyVotes / $totalValid * 100, 2) : 0.0,
                'total_valid'     => $totalValid,
                'qty_blank'       => (int) $row->qty_blank,
                'qty_null'        => (int) $row->qty_null,
                'qty_legend'      => $qtyLegend,
                'qty_party_total' => (int) $row->qty_party_nominal + $qtyLegend,
                'qty_total'       => (int) $row->qty_total,
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

        $cities = DB::connection('pgsql_maps')->select("
            SELECT c.id, c.name, c.ibge_code,
                   COALESCE(SUM(v.qty_votes), 0) AS qty_votes
            FROM maps.cities c
            LEFT JOIN maps.votes v ON v.city_id = c.id
                AND v.candidacy_id = ?
                AND v.vote_type = 'candidate'
                AND v.year = ?
                AND v.round = (SELECT MAX(round) FROM maps.votes WHERE candidacy_id = ? AND year = ?)
            WHERE c.state_id = ?
              AND c.tse_code SIMILAR TO '[0-9]+'
            GROUP BY c.id, c.name, c.ibge_code
            ORDER BY qty_votes DESC, c.name ASC
        ", [$id, $candidacy->year, $id, $candidacy->year, $candidacy->state_id]);

        return response()->json($cities);
    }

    public function candidaciesByPerson(Request $request, int $id)
    {
        $rows = DB::connection('pgsql_maps')->select("
            SELECT
                cy.id,
                cy.ballot_name,
                cy.role,
                cy.year,
                cy.number,
                cy.status,
                p.abbreviation    AS party,
                p.color_bg        AS party_color_bg,
                p.color_text      AS party_color_text,
                p.color_gradient  AS party_color_gradient,
                s.uf            AS state_uf,
                ci.name         AS city_name
            FROM maps.candidacies cy
            LEFT JOIN maps.parties p  ON p.id = cy.party_id
            LEFT JOIN maps.states  s  ON s.id = cy.state_id
            LEFT JOIN maps.cities  ci ON ci.id = cy.city_id
            WHERE cy.candidate_id = ?
            ORDER BY cy.year DESC, cy.role
        ", [$id]);

        return response()->json($rows);
    }

    public function searchPersons(Request $request)
    {
        $q = trim($request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $results = DB::connection('pgsql_maps')->select("
            SELECT id, name, photo_url
            FROM maps.candidates
            WHERE unaccent(name) ILIKE unaccent(?)
            ORDER BY name
            LIMIT 20
        ", ["%{$q}%"]);

        return response()->json($results);
    }
}
