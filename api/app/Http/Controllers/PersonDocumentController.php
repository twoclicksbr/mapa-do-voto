<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;

class PersonDocumentController extends Controller
{
    public function index(int $personId)
    {
        return Document::with('typeDocument:id,name')
            ->where('modulo', 'people')
            ->where('record_id', $personId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'type_document_id', 'value', 'validity', 'order', 'active']);
    }

    public function store(Request $request, int $personId)
    {
        $validated = $request->validate([
            'type_document_id' => ['required', 'integer', 'exists:type_documents,id'],
            'value'            => ['required', 'string', 'max:255'],
            'validity'         => ['nullable', 'date'],
        ]);

        $maxOrder = Document::where('modulo', 'people')->where('record_id', $personId)->max('order') ?? 0;

        $document = Document::create([
            'modulo'    => 'people',
            'record_id' => $personId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $document->load('typeDocument:id,name');

        return response()->json($document, 201);
    }

    public function update(Request $request, int $personId, int $id)
    {
        $document = Document::where('modulo', 'people')->where('record_id', $personId)->findOrFail($id);

        $validated = $request->validate([
            'type_document_id' => ['sometimes', 'integer', 'exists:type_documents,id'],
            'value'            => ['sometimes', 'string', 'max:255'],
            'validity'         => ['nullable', 'date'],
            'active'           => ['boolean'],
        ]);

        $document->update($validated);
        $document->load('typeDocument:id,name');

        return response()->json($document);
    }

    public function destroy(int $personId, int $id)
    {
        $document = Document::where('modulo', 'people')->where('record_id', $personId)->findOrFail($id);
        $document->delete();

        return response()->json(null, 204);
    }
}
