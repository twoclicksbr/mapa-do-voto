<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = DB::table('gabinete_master.tenants')
            ->where('active', true)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'active', 'valid_until']);

        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255',
            'active'      => 'boolean',
            'valid_until' => 'required|date',
        ]);

        $schema = 'gabinete_' . $validated['slug'];

        $slugExists = DB::table('gabinete_master.tenants')
            ->whereNull('deleted_at')
            ->where('slug', $validated['slug'])
            ->exists();

        if ($slugExists) {
            return response()->json([
                'errors' => ['slug' => ['Este subdomínio já está em uso.']],
            ], 422);
        }

        $tenant = Tenant::create([
            'name'        => $validated['name'],
            'slug'        => $validated['slug'],
            'schema'      => $schema,
            'active'      => $validated['active'] ?? true,
            'valid_until' => $validated['valid_until'],
        ]);

        DB::statement("CREATE SCHEMA IF NOT EXISTS \"{$schema}\"");

        return response()->json([
            'id'          => $tenant->id,
            'name'        => $tenant->name,
            'slug'        => $tenant->slug,
            'active'      => $tenant->active,
            'valid_until' => $tenant->valid_until->format('Y-m-d'),
        ], 201);
    }

    public function person(int $id)
    {
        $person = DB::table('gabinete_master.people')
            ->where('tenant_id', $id)
            ->whereNull('deleted_at')
            ->first(['id', 'type_people_id', 'name', 'active']);

        $typePeople = DB::table('gabinete_master.type_people')->get(['id', 'name']);

        return response()->json([
            'person'      => $person,
            'type_people' => $typePeople,
        ]);
    }

    public function storePerson(Request $request, int $id)
    {
        Tenant::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type_people_id' => 'required|integer',
            'active'         => 'boolean',
        ]);

        $typeExists = DB::table('gabinete_master.type_people')->where('id', $validated['type_people_id'])->exists();
        if (!$typeExists) {
            return response()->json(['errors' => ['type_people_id' => ['Tipo inválido.']]], 422);
        }

        $person = People::create([
            'tenant_id'      => $id,
            'type_people_id' => $validated['type_people_id'],
            'name'           => $validated['name'],
            'active'         => $validated['active'] ?? true,
        ]);

        return response()->json([
            'id'             => $person->id,
            'type_people_id' => $person->type_people_id,
            'name'           => $person->name,
            'active'         => $person->active,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255',
            'active'      => 'boolean',
            'valid_until' => 'required|date',
        ]);

        $slugExists = DB::table('gabinete_master.tenants')
            ->whereNull('deleted_at')
            ->where('slug', $validated['slug'])
            ->where('id', '!=', $id)
            ->exists();

        if ($slugExists) {
            return response()->json([
                'errors' => ['slug' => ['Este subdomínio já está em uso.']],
            ], 422);
        }

        $tenant->update($validated);

        return response()->json([
            'id'          => $tenant->id,
            'name'        => $tenant->name,
            'slug'        => $tenant->slug,
            'active'      => $tenant->active,
            'valid_until' => $tenant->valid_until->format('Y-m-d'),
        ]);
    }
}
