<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;

class AttendanceNoteController extends Controller
{
    public function index(int $attendanceId)
    {
        return response()->json(
            Note::where('modulo', 'attendances')
                ->where('record_id', $attendanceId)
                ->orderBy('order')
                ->orderBy('id')
                ->get(['id', 'value', 'order', 'active', 'created_at'])
        );
    }

    public function store(Request $request, int $attendanceId)
    {
        $request->validate(['value' => 'required|string']);

        $maxOrder = Note::where('modulo', 'attendances')->where('record_id', $attendanceId)->max('order') ?? 0;

        $note = Note::create([
            'modulo'    => 'attendances',
            'record_id' => $attendanceId,
            'value'     => $request->value,
            'order'     => $maxOrder + 1,
            'active'    => true,
        ]);

        return response()->json($note, 201);
    }

    public function destroy(int $attendanceId, int $noteId)
    {
        $note = Note::where('modulo', 'attendances')->where('record_id', $attendanceId)->findOrFail($noteId);
        $note->delete();

        return response()->json(null, 204);
    }
}
