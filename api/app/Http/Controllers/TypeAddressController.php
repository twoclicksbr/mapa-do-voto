<?php

namespace App\Http\Controllers;

use App\Http\Requests\TypeAddressRequest;
use App\Models\TypeAddress;

class TypeAddressController extends Controller
{
    public function index()
    {
        $typeAddresses = TypeAddress::orderBy('order')->get(['id', 'name', 'order', 'active', 'created_at', 'updated_at']);

        return response()->json($typeAddresses);
    }

    public function store(TypeAddressRequest $request)
    {
        $typeAddress = TypeAddress::create($request->validated());

        return response()->json($this->format($typeAddress), 201);
    }

    public function update(TypeAddressRequest $request, int $id)
    {
        $typeAddress = TypeAddress::findOrFail($id);
        $typeAddress->update($request->validated());

        return response()->json($this->format($typeAddress));
    }

    public function destroy(int $id)
    {
        $typeAddress = TypeAddress::findOrFail($id);
        $typeAddress->delete();

        return response()->json(null, 204);
    }

    private function format(TypeAddress $typeAddress): array
    {
        return [
            'id'         => $typeAddress->id,
            'name'       => $typeAddress->name,
            'order'      => $typeAddress->order,
            'active'     => $typeAddress->active,
            'created_at' => $typeAddress->created_at,
            'updated_at' => $typeAddress->updated_at,
        ];
    }
}
