<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class PersonNoteController extends Controller
{
    public function index(int $personId)
    {
        return Note::where('modulo', 'people')
            ->where('record_id', $personId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'value', 'order', 'active', 'created_at']);
    }

    public function store(Request $request, int $personId)
    {
        $validated = $request->validate([
            'value' => ['required', 'string'],
        ]);

        $maxOrder = Note::where('modulo', 'people')->where('record_id', $personId)->max('order') ?? 0;

        $note = Note::create([
            'modulo'    => 'people',
            'record_id' => $personId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        return response()->json($note, 201);
    }

    public function update(Request $request, int $personId, int $id)
    {
        $note = Note::where('modulo', 'people')->where('record_id', $personId)->findOrFail($id);

        $validated = $request->validate([
            'value'  => ['sometimes', 'string'],
            'active' => ['boolean'],
        ]);

        $note->update($validated);

        return response()->json($note);
    }

    public function destroy(int $personId, int $id)
    {
        $note = Note::where('modulo', 'people')->where('record_id', $personId)->findOrFail($id);
        $note->delete();

        return response()->json(null, 204);
    }
}
