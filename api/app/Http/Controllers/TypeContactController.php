<?php

namespace App\Http\Controllers;

use App\Http\Requests\TypeContactRequest;
use App\Models\TypeContact;

class TypeContactController extends Controller
{
    public function index()
    {
        $typeContacts = TypeContact::orderBy('order')->get(['id', 'name', 'mask', 'order', 'active', 'created_at', 'updated_at']);

        return response()->json($typeContacts);
    }

    public function store(TypeContactRequest $request)
    {
        $typeContact = TypeContact::create($request->validated());

        return response()->json($this->format($typeContact), 201);
    }

    public function update(TypeContactRequest $request, int $id)
    {
        $typeContact = TypeContact::findOrFail($id);
        $typeContact->update($request->validated());

        return response()->json($this->format($typeContact));
    }

    public function destroy(int $id)
    {
        $typeContact = TypeContact::findOrFail($id);
        $typeContact->delete();

        return response()->json(null, 204);
    }

    private function format(TypeContact $typeContact): array
    {
        return [
            'id'         => $typeContact->id,
            'name'       => $typeContact->name,
            'mask'       => $typeContact->mask,
            'order'      => $typeContact->order,
            'active'     => $typeContact->active,
            'created_at' => $typeContact->created_at,
            'updated_at' => $typeContact->updated_at,
        ];
    }
}
