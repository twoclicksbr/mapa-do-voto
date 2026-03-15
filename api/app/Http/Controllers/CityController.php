<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CityController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'q'        => 'required|string|min:2',
            'state_id' => 'required|integer',
        ]);

        $q       = $request->input('q');
        $stateId = (int) $request->input('state_id');

        $cities = DB::table('maps.cities')
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
