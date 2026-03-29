<?php

namespace App\Http\Controllers;

use App\Http\Requests\TypeDocumentRequest;
use App\Models\TypeDocument;

class TypeDocumentController extends Controller
{
    public function index()
    {
        $typeDocuments = TypeDocument::orderBy('order')->get(['id', 'name', 'mask', 'validity', 'order', 'active', 'created_at', 'updated_at']);

        return response()->json($typeDocuments);
    }

    public function store(TypeDocumentRequest $request)
    {
        $typeDocument = TypeDocument::create($request->validated());

        return response()->json($this->format($typeDocument), 201);
    }

    public function update(TypeDocumentRequest $request, int $id)
    {
        $typeDocument = TypeDocument::findOrFail($id);
        $typeDocument->update($request->validated());

        return response()->json($this->format($typeDocument));
    }

    public function destroy(int $id)
    {
        $typeDocument = TypeDocument::findOrFail($id);
        $typeDocument->delete();

        return response()->json(null, 204);
    }

    private function format(TypeDocument $typeDocument): array
    {
        return [
            'id'         => $typeDocument->id,
            'name'       => $typeDocument->name,
            'mask'       => $typeDocument->mask,
            'validity'   => (bool) $typeDocument->validity,
            'order'      => $typeDocument->order,
            'active'     => $typeDocument->active,
            'created_at' => $typeDocument->created_at,
            'updated_at' => $typeDocument->updated_at,
        ];
    }
}
