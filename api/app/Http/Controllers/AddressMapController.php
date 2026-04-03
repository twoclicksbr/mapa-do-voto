<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressMapController extends Controller
{
    public function index(Request $request)
    {
        $modulo = $request->input('modulo'); // 'people' | 'attendances'

        $query = DB::table('gabinete_master.addresses as a')
            ->whereNotNull('a.lat')
            ->whereNotNull('a.lng')
            ->whereNull('a.deleted_at')
            ->where('a.active', true);

        if ($modulo === 'people') {
            $query
                ->join('gabinete_master.people as p', 'p.id', '=', 'a.record_id')
                ->where('a.modulo', 'people')
                ->select('a.id', 'a.record_id', 'a.lat', 'a.lng', 'a.logradouro', 'a.numero', 'a.bairro', 'a.cidade', 'p.name');
        } elseif ($modulo === 'attendances') {
            $query
                ->join('gabinete_master.attendances as att', 'att.id', '=', 'a.record_id')
                ->where('a.modulo', 'attendances')
                ->whereNull('att.deleted_at')
                ->select('a.id', 'a.record_id', 'a.lat', 'a.lng', 'a.logradouro', 'a.numero', 'a.bairro', 'a.cidade', 'att.title as name');
        } else {
            return response()->json([]);
        }

        return response()->json($query->get());
    }
}
