<?php

namespace App\Http\Controllers;

use App\Http\Requests\PeopleRequest;
use App\Models\People;
use App\Http\Controllers\PeopleAvatarController;

class PeopleController extends Controller
{
    public function index()
    {
        $people = People::with('typePeople:id,name')
            ->orderBy('name')
            ->get(['id', 'type_people_id', 'name', 'birth_date', 'photo_path', 'active']);

        return response()->json($people->map(fn ($p) => $this->format($p)));
    }

    public function store(PeopleRequest $request)
    {
        $person = People::create($request->validated());
        $person->load('typePeople:id,name');

        return response()->json($this->format($person), 201);
    }

    public function update(PeopleRequest $request, int $id)
    {
        $person = People::findOrFail($id);
        $person->update($request->validated());
        $person->load('typePeople:id,name');

        return response()->json($this->format($person));
    }

    public function destroy(int $id)
    {
        $person = People::findOrFail($id);
        $person->delete();

        return response()->json(null, 204);
    }

    private function format(People $person): array
    {
        return array_merge([
            'id'             => $person->id,
            'name'           => $person->name,
            'birth_date'     => $person->birth_date?->format('Y-m-d'),
            'photo_path'     => $person->photo_path,
            'type_people_id' => $person->type_people_id,
            'type_people'    => $person->typePeople ? [
                'id'   => $person->typePeople->id,
                'name' => $person->typePeople->name,
            ] : null,
            'active'         => $person->active,
        ], PeopleAvatarController::avatarUrls($person->photo_path));
    }
}
