<?php

namespace App\Http\Controllers;

use App\Http\Requests\PeopleRequest;
use App\Models\People;
use App\Http\Controllers\PeopleAvatarController;

class PeopleController extends Controller
{
    public function index()
    {
        $people = People::with(['typePeople:id,name', 'contacts.typeContact', 'documents.typeDocument', 'addresses.typeAddress'])
            ->orderBy('name')
            ->get(['id', 'type_people_id', 'name', 'birth_date', 'photo_path', 'active', 'created_at', 'updated_at', 'deleted_at']);

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
            'created_at'     => $person->created_at?->toIso8601String(),
            'updated_at'     => $person->updated_at?->toIso8601String(),
            'deleted_at'     => $person->deleted_at?->toIso8601String(),
            'addresses'      => $person->addresses->map(fn ($a) => [
                'id'              => $a->id,
                'type_address_id' => $a->type_address_id,
                'type_address'    => $a->typeAddress ? ['id' => $a->typeAddress->id, 'name' => $a->typeAddress->name] : null,
                'cep'             => $a->cep,
                'logradouro'      => $a->logradouro,
                'numero'          => $a->numero,
                'bairro'          => $a->bairro,
                'cidade'          => $a->cidade,
                'uf'              => $a->uf,
            ])->values()->toArray(),
            'documents'      => $person->documents->map(fn ($d) => [
                'id'               => $d->id,
                'type_document_id' => $d->type_document_id,
                'type_document'    => $d->typeDocument ? ['id' => $d->typeDocument->id, 'name' => $d->typeDocument->name, 'mask' => $d->typeDocument->mask] : null,
                'value'            => $d->value,
            ])->values()->toArray(),
            'contacts'       => $person->contacts ? $person->contacts->map(fn ($c) => [
                'id'              => $c->id,
                'type_contact_id' => $c->type_contact_id,
                'type_contact'    => $c->typeContact ? ['id' => $c->typeContact->id, 'name' => $c->typeContact->name, 'mask' => $c->typeContact->mask] : null,
                'value'           => $c->value,
            ])->values()->toArray() : [],
        ], PeopleAvatarController::avatarUrls($person->photo_path));
    }
}
