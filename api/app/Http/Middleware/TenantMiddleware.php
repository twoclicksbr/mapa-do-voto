<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $host      = $request->getHost();
        $parts     = explode('.', $host);
        $subdomain = count($parts) > 1 ? $parts[0] : null;

        if (! $subdomain) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $tenant = DB::table('gabinete_master.tenants')
            ->where('slug', $subdomain)
            ->where('active', true)
            ->whereNull('deleted_at')
            ->first();

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $request->attributes->set('tenant', $tenant);

        DB::statement("SET search_path TO {$tenant->schema},maps,public");

        return $next($request);
    }
}
