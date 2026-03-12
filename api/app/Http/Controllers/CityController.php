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

        $cities = DB::table('cities')
            ->select('id', 'name')
            ->where('state_id', $stateId)
            ->whereRaw("unaccent(name) ILIKE unaccent(?)", ["%{$q}%"])
            ->orderBy('name')
            ->limit(10)
            ->get();

        return response()->json($cities);
    }
}
