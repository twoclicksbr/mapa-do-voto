<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;

class PersonContactController extends Controller
{
    public function index(int $personId)
    {
        return Contact::with('typeContact:id,name,mask')
            ->where('modulo', 'people')
            ->where('record_id', $personId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'type_contact_id', 'value', 'order', 'active']);
    }

    public function store(Request $request, int $personId)
    {
        $validated = $request->validate([
            'type_contact_id' => ['required', 'integer', 'exists:type_contacts,id'],
            'value'           => ['required', 'string', 'max:255'],
        ]);

        $maxOrder = Contact::where('modulo', 'people')->where('record_id', $personId)->max('order') ?? 0;

        $contact = Contact::create([
            'modulo'    => 'people',
            'record_id' => $personId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $contact->load('typeContact:id,name,mask');

        return response()->json($contact, 201);
    }

    public function update(Request $request, int $personId, int $id)
    {
        $contact = Contact::where('modulo', 'people')->where('record_id', $personId)->findOrFail($id);

        $validated = $request->validate([
            'type_contact_id' => ['sometimes', 'integer', 'exists:type_contacts,id'],
            'value'           => ['sometimes', 'string', 'max:255'],
            'active'          => ['boolean'],
        ]);

        $contact->update($validated);
        $contact->load('typeContact:id,name,mask');

        return response()->json($contact);
    }

    public function destroy(int $personId, int $id)
    {
        $contact = Contact::where('modulo', 'people')->where('record_id', $personId)->findOrFail($id);
        $contact->delete();

        return response()->json(null, 204);
    }
}
