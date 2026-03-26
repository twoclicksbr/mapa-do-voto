<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class FinTitleNoteController extends Controller
{
    public function index(int $titleId)
    {
        return response()->json(
            Note::where('modulo', 'fin_titles')
                ->where('record_id', $titleId)
                ->orderBy('order')
                ->orderBy('id')
                ->get(['id', 'value', 'order', 'active', 'created_at'])
        );
    }

    public function store(Request $request, int $titleId)
    {
        $request->validate(['value' => 'required|string']);

        $maxOrder = Note::where('modulo', 'fin_titles')->where('record_id', $titleId)->max('order') ?? 0;

        $note = Note::create([
            'modulo'    => 'fin_titles',
            'record_id' => $titleId,
            'value'     => $request->value,
            'order'     => $maxOrder + 1,
            'active'    => true,
        ]);

        return response()->json($note, 201);
    }

    public function destroy(int $titleId, int $noteId)
    {
        $note = Note::where('modulo', 'fin_titles')->where('record_id', $titleId)->findOrFail($noteId);
        $note->delete();

        return response()->json(null, 204);
    }
}
