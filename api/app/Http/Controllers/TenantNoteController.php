<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class TenantNoteController extends Controller
{
    public function index(int $tenantId)
    {
        return Note::where('modulo', 'tenants')
            ->where('record_id', $tenantId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'value', 'order', 'active', 'created_at']);
    }

    public function store(Request $request, int $tenantId)
    {
        $validated = $request->validate([
            'value' => ['required', 'string'],
        ]);

        $maxOrder = Note::where('modulo', 'tenants')->where('record_id', $tenantId)->max('order') ?? 0;

        $note = Note::create([
            'modulo'    => 'tenants',
            'record_id' => $tenantId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        return response()->json($note, 201);
    }

    public function update(Request $request, int $tenantId, int $id)
    {
        $note = Note::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'value'  => ['sometimes', 'string'],
            'active' => ['boolean'],
        ]);

        $note->update($validated);

        return response()->json($note);
    }

    public function destroy(int $tenantId, int $id)
    {
        $note = Note::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);
        $note->delete();

        return response()->json(null, 204);
    }
}
