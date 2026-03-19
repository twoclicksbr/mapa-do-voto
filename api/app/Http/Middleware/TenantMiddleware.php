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
        $tenant = null;

        // 1. Tenta pelo Host (dev: master.mapadovoto-api.test)
        $host  = $request->getHost();
        $parts = explode('.', $host);
        if (count($parts) > 2) {
            $tenant = DB::table('gabinete_master.tenants')
                ->where('slug', $parts[0])
                ->where('active', true)
                ->whereNull('deleted_at')
                ->first();
        }

        // 2. Fallback: Origin header (prod: https://master.mapadovoto.com)
        if (! $tenant) {
            $origin      = $request->headers->get('Origin', '');
            $originHost  = parse_url($origin, PHP_URL_HOST) ?? '';
            $originParts = explode('.', $originHost);
            if (count($originParts) > 2) {
                $tenant = DB::table('gabinete_master.tenants')
                    ->where('slug', $originParts[0])
                    ->where('active', true)
                    ->whereNull('deleted_at')
                    ->first();
            }
        }

        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found.'], 404);
        }

        $request->attributes->set('tenant', $tenant);

        DB::statement("SET search_path TO {$tenant->schema},public");

        return $next($request);
    }
}
