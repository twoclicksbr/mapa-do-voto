<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;

class TenantDocumentController extends Controller
{
    public function index(int $tenantId)
    {
        return Document::with('typeDocument:id,name')
            ->where('modulo', 'tenants')
            ->where('record_id', $tenantId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'type_document_id', 'value', 'validity', 'order', 'active']);
    }

    public function store(Request $request, int $tenantId)
    {
        $validated = $request->validate([
            'type_document_id' => ['required', 'integer', 'exists:type_documents,id'],
            'value'            => ['required', 'string', 'max:255'],
            'validity'         => ['nullable', 'date'],
        ]);

        $maxOrder = Document::where('modulo', 'tenants')->where('record_id', $tenantId)->max('order') ?? 0;

        $document = Document::create([
            'modulo'    => 'tenants',
            'record_id' => $tenantId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $document->load('typeDocument:id,name');

        return response()->json($document, 201);
    }

    public function update(Request $request, int $tenantId, int $id)
    {
        $document = Document::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);

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

    public function destroy(int $tenantId, int $id)
    {
        $document = Document::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);
        $document->delete();

        return response()->json(null, 204);
    }
}
