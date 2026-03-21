<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\PeopleCandidacy;
use Illuminate\Http\Request;

class PeopleCandidacyController extends Controller
{
    public function store(Request $request, int $personId)
    {
        People::findOrFail($personId);

        $request->validate([
            'candidacy_ids'   => 'required|array|min:1',
            'candidacy_ids.*' => 'required|integer',
        ]);

        $created = [];
        foreach ($request->candidacy_ids as $order => $candidacyId) {
            $existing = PeopleCandidacy::where('people_id', $personId)
                ->where('candidacy_id', $candidacyId)
                ->first();

            if (!$existing) {
                $created[] = PeopleCandidacy::create([
                    'people_id'    => $personId,
                    'candidacy_id' => $candidacyId,
                    'order'        => $order + 1,
                    'active'       => true,
                ]);
            }
        }

        return response()->json(['created' => count($created)], 201);
    }
}
