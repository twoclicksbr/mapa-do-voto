<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $tenants = DB::table('gabinete_master.tenants')
            ->where('active', true)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'active', 'valid_until']);

        return response()->json($tenants);
    }
}
