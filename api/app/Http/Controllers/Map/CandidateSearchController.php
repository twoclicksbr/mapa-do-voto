<?php

namespace App\Http\Controllers\Map;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CandidateSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim($request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $user   = $request->user();
        $people = $user->people;
        $like   = '%' . $q . '%';

        if ($people && $people->hasPermission('search_all_candidates')) {
            $rows = DB::select(
                'SELECT c.id, c.name, c.ballot_name, c.role, c.year, c.state, c.city_ibge_code,
                        p.abbreviation AS party_abbreviation
                 FROM candidates c
                 LEFT JOIN parties p ON p.id = c.party_id
                 WHERE c.deleted_at IS NULL
                   AND (c.name ILIKE ? OR c.ballot_name ILIKE ?)
                 ORDER BY c.name
                 LIMIT 10',
                [$like, $like]
            );
        } else {
            $rows = DB::select(
                'SELECT c.id, c.name, c.ballot_name, c.role, c.year, c.state, c.city_ibge_code,
                        p.abbreviation AS party_abbreviation
                 FROM candidates c
                 LEFT JOIN parties p ON p.id = c.party_id
                 JOIN user_candidates uc ON uc.candidate_id = c.id
                 WHERE c.deleted_at IS NULL
                   AND uc.user_id = ?
                   AND uc.active = true
                   AND (c.name ILIKE ? OR c.ballot_name ILIKE ?)
                 ORDER BY c.name
                 LIMIT 10',
                [$user->id, $like, $like]
            );
        }

        $result = array_map(fn($row) => [
            'id'             => $row->id,
            'name'           => $row->name,
            'ballot_name'    => $row->ballot_name,
            'role'           => $row->role,
            'year'           => $row->year,
            'state'          => $row->state ? trim($row->state) : null,
            'city_ibge_code' => $row->city_ibge_code,
            'party'          => ['abbreviation' => $row->party_abbreviation],
        ], $rows);

        return response()->json($result);
    }
}
