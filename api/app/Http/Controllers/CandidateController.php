<?php

namespace App\Http\Controllers;

use App\Models\UserCandidate;
use Illuminate\Http\Request;

class CandidateController extends Controller
{
    public function index(Request $request)
    {
        $userCandidates = UserCandidate::with('candidate.party')
            ->where('user_id', $request->user()->id)
            ->where('active', true)
            ->orderBy('order')
            ->get();

        $candidates = $userCandidates->map(function (UserCandidate $uc) {
            $c = $uc->candidate;
            return [
                'id'          => $c->id,
                'uuid'        => $c->uuid,
                'name'        => $c->name,
                'ballot_name' => $c->ballot_name,
                'role'        => $c->role,
                'year'        => $c->year,
                'state'       => $c->state,
                'avatar_url'  => $c->avatar_url,
                'status'      => $c->status,
                'party'       => [
                    'id'           => $c->party->id,
                    'name'         => $c->party->name,
                    'abbreviation' => $c->party->abbreviation,
                ],
            ];
        });

        return response()->json($candidates);
    }
}
