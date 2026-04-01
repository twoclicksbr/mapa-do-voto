<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;

class AttendanceDocumentController extends Controller
{
    public function index(int $attendanceId)
    {
        return Document::with('typeDocument:id,name,mask,validity')
            ->where('modulo', 'attendance')
            ->where('record_id', $attendanceId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'type_document_id', 'value', 'validity', 'order', 'active']);
    }

    public function store(Request $request, int $attendanceId)
    {
        $validated = $request->validate([
            'type_document_id' => ['required', 'integer', 'exists:type_documents,id'],
            'value'            => ['required', 'string', 'max:255'],
            'validity'         => ['nullable', 'date'],
        ]);

        $maxOrder = Document::where('modulo', 'attendance')->where('record_id', $attendanceId)->max('order') ?? 0;

        $doc = Document::create([
            'modulo'    => 'attendance',
            'record_id' => $attendanceId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $doc->load('typeDocument:id,name,mask,validity');

        return response()->json($doc, 201);
    }

    public function update(Request $request, int $attendanceId, int $id)
    {
        $doc = Document::where('modulo', 'attendance')->where('record_id', $attendanceId)->findOrFail($id);

        $validated = $request->validate([
            'type_document_id' => ['sometimes', 'integer', 'exists:type_documents,id'],
            'value'            => ['sometimes', 'string', 'max:255'],
            'validity'         => ['nullable', 'date'],
            'active'           => ['boolean'],
        ]);

        $doc->update($validated);
        $doc->load('typeDocument:id,name,mask,validity');

        return response()->json($doc);
    }

    public function destroy(int $attendanceId, int $id)
    {
        $doc = Document::where('modulo', 'attendance')->where('record_id', $attendanceId)->findOrFail($id);
        $doc->delete();

        return response()->json(null, 204);
    }
}
