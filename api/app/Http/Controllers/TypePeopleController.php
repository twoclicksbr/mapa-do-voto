<?php

namespace App\Http\Controllers;

use App\Http\Requests\TypePeopleRequest;
use App\Models\TypePeople;

class TypePeopleController extends Controller
{
    public function index()
    {
        $typePeople = TypePeople::orderBy('order')->get(['id', 'name', 'order', 'active', 'created_at', 'updated_at']);

        return response()->json($typePeople);
    }

    public function store(TypePeopleRequest $request)
    {
        $typePeople = TypePeople::create($request->validated());

        return response()->json($this->format($typePeople), 201);
    }

    public function update(TypePeopleRequest $request, int $id)
    {
        $typePeople = TypePeople::findOrFail($id);
        $typePeople->update($request->validated());

        return response()->json($this->format($typePeople));
    }

    public function destroy(int $id)
    {
        $typePeople = TypePeople::findOrFail($id);
        $typePeople->delete();

        return response()->json(null, 204);
    }

    private function format(TypePeople $typePeople): array
    {
        return [
            'id'         => $typePeople->id,
            'name'       => $typePeople->name,
            'order'      => $typePeople->order,
            'active'     => $typePeople->active,
            'created_at' => $typePeople->created_at,
            'updated_at' => $typePeople->updated_at,
        ];
    }
}
