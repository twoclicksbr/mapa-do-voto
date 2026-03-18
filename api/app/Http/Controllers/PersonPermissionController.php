<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\Permission;
use App\Models\PermissionAction;
use Illuminate\Http\Request;

class PersonPermissionController extends Controller
{
    /**
     * Retorna todas as permission_actions com o estado allowed da pessoa.
     * Se não existe registro, allowed = true (default permissivo).
     */
    public function index(int $personId)
    {
        People::findOrFail($personId);

        $actions = PermissionAction::orderBy('module')->orderBy('action')->get();

        $existing = Permission::where('people_id', $personId)
            ->whereNull('deleted_at')
            ->pluck('allowed', 'permission_action_id');

        $result = $actions->map(fn($a) => [
            'id'          => $a->id,
            'module'      => $a->module,
            'action'      => $a->action,
            'description' => $a->description,
            'allowed'     => $existing->has($a->id) ? (bool) $existing[$a->id] : true,
        ]);

        return response()->json($result);
    }

    /**
     * Upsert de uma permissão específica.
     */
    public function update(Request $request, int $personId, int $actionId)
    {
        People::findOrFail($personId);
        PermissionAction::findOrFail($actionId);

        $request->validate(['allowed' => 'required|boolean']);

        Permission::withTrashed()->updateOrCreate(
            ['people_id' => $personId, 'permission_action_id' => $actionId],
            ['allowed' => $request->allowed, 'deleted_at' => null]
        );

        return response()->json(['allowed' => $request->allowed]);
    }
}
