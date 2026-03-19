<?php

namespace App\Http\Controllers;

use App\Models\PermissionAction;
use Illuminate\Http\Request;

class PermissionActionController extends Controller
{
    public function index()
    {
        return response()->json(
            PermissionAction::orderBy('order')->orderBy('id')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'module'      => 'required|string|max:255',
            'name_module' => 'nullable|string|max:255',
            'action'      => 'required|string|max:255',
            'name_action' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:255',
        ]);

        $data['order'] = (PermissionAction::max('order') ?? 0) + 1;

        return response()->json(PermissionAction::create($data), 201);
    }

    public function update(Request $request, int $id)
    {
        $action = PermissionAction::findOrFail($id);

        $data = $request->validate([
            'module'      => 'required|string|max:255',
            'name_module' => 'nullable|string|max:255',
            'action'      => 'required|string|max:255',
            'name_action' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:255',
        ]);

        $action->update($data);

        return response()->json($action);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            '*.id'    => 'required|integer',
            '*.order' => 'required|integer|min:1',
        ]);

        foreach ($request->all() as $item) {
            PermissionAction::where('id', (int) $item['id'])
                ->update(['order' => (int) $item['order']]);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id)
    {
        PermissionAction::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }
}
