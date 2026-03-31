<?php

namespace App\Http\Controllers;

use App\Http\Controllers\PeopleAvatarController;
use App\Http\Controllers\TenantAvatarController;
use App\Models\People;
use App\Models\PeopleCandidacy;
use App\Models\Tenant;
use App\Models\TypePeople;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::where('active', true)
            ->orderBy('name')
            ->get(['id', 'tenant_id', 'plan_id', 'name', 'slug', 'active', 'valid_until', 'logo_path']);

        return response()->json($tenants->map(fn ($t) => array_merge([
            'id'          => $t->id,
            'tenant_id'   => $t->tenant_id,
            'plan_id'     => $t->plan_id,
            'name'        => $t->name,
            'slug'        => $t->slug,
            'active'      => $t->active,
            'valid_until' => $t->valid_until?->format('Y-m-d'),
        ], TenantAvatarController::logoUrls($t->logo_path)))->values());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255',
            'has_schema'  => 'boolean',
            'active'      => 'boolean',
            'valid_until' => 'required|date',
            'people_id'   => 'nullable|integer',
            'plan_id'     => 'nullable|integer|exists:plans,id',
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

        $hasSchema = $validated['has_schema'] ?? false;

        $tenant = Tenant::create([
            'name'        => $validated['name'],
            'slug'        => $validated['slug'],
            'schema'      => $schema,
            'has_schema'  => $hasSchema,
            'plan_id'     => $validated['plan_id'] ?? null,
            'active'      => $validated['active'] ?? true,
            'valid_until' => $validated['valid_until'],
        ]);

        if ($hasSchema) {
            DB::statement("CREATE SCHEMA IF NOT EXISTS \"{$schema}\"");
        }

        if (!empty($validated['people_id'])) {
            People::where('id', $validated['people_id'])->update(['tenant_id' => $tenant->id]);
        }

        return response()->json([
            'id'          => $tenant->id,
            'plan_id'     => $tenant->plan_id,
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

        $typePeople = TypePeople::where('active', true)->orderBy('order')->get(['id', 'name']);

        return response()->json([
            'person'      => $person,
            'type_people' => $typePeople,
        ]);
    }

    public function people(int $id)
    {
        $people = People::with(['typePeople:id,name'])
            ->where('tenant_id', $id)
            ->orderBy('name')
            ->get(['id', 'type_people_id', 'name', 'birth_date', 'photo_path', 'active']);

        return response()->json($people->map(fn ($p) => array_merge([
            'id'             => $p->id,
            'name'           => $p->name,
            'birth_date'     => $p->birth_date?->format('Y-m-d'),
            'photo_path'     => $p->photo_path,
            'type_people_id' => $p->type_people_id,
            'type_people'    => $p->typePeople ? ['id' => $p->typePeople->id, 'name' => $p->typePeople->name] : null,
            'active'         => $p->active,
        ], PeopleAvatarController::avatarUrls($p->photo_path)))->values());
    }

    public function storePerson(Request $request, int $id)
    {
        Tenant::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type_people_id' => 'required|integer',
            'active'         => 'boolean',
        ]);

        $typeExists = TypePeople::where('id', $validated['type_people_id'])->where('active', true)->exists();
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

    public function storeClient(Request $request, int $id)
    {
        $reseller = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255',
            'has_schema'  => 'boolean',
            'valid_until' => 'required|date',
        ]);

        $slugExists = DB::table('gabinete_master.tenants')
            ->whereNull('deleted_at')
            ->where('slug', $validated['slug'])
            ->exists();

        if ($slugExists) {
            return response()->json([
                'errors' => ['slug' => ['Este subdomínio já está em uso.']],
            ], 422);
        }

        $schema    = 'gabinete_' . $validated['slug'];
        $hasSchema = $validated['has_schema'] ?? false;

        $tenant = Tenant::create([
            'tenant_id'   => $reseller->id,
            'name'        => $validated['name'],
            'slug'        => $validated['slug'],
            'schema'      => $schema,
            'has_schema'  => $hasSchema,
            'active'      => true,
            'valid_until' => $validated['valid_until'],
        ]);

        if ($hasSchema) {
            DB::statement("CREATE SCHEMA IF NOT EXISTS \"{$schema}\"");
        }

        return response()->json([
            'id'          => $tenant->id,
            'tenant_id'   => $tenant->tenant_id,
            'name'        => $tenant->name,
            'slug'        => $tenant->slug,
            'has_schema'  => $tenant->has_schema,
            'active'      => $tenant->active,
            'valid_until' => $tenant->valid_until->format('Y-m-d'),
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
            'plan_id'     => 'nullable|integer|exists:plans,id',
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

        return response()->json(array_merge([
            'id'          => $tenant->id,
            'plan_id'     => $tenant->plan_id,
            'name'        => $tenant->name,
            'slug'        => $tenant->slug,
            'active'      => $tenant->active,
            'valid_until' => $tenant->valid_until->format('Y-m-d'),
        ], TenantAvatarController::logoUrls($tenant->logo_path)));
    }
}
