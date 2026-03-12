<?php

namespace App\Http\Controllers;

use App\Models\State;
use Illuminate\Http\JsonResponse;

class StateController extends Controller
{
    public function geometry(string $uf): JsonResponse
    {
        $state = State::where('uf', strtoupper($uf))->first();

        if (! $state || ! $state->geometry) {
            return response()->json(['error' => 'Geometry not found'], 404);
        }

        $geometry = is_string($state->geometry)
            ? json_decode($state->geometry)
            : $state->geometry;

        return response()->json([
            'uf'       => $state->uf,
            'geometry' => $geometry,
        ]);
    }
}
