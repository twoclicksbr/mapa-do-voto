<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;

class TenantContactController extends Controller
{
    public function index(int $tenantId)
    {
        return Contact::with('typeContact:id,name,mask')
            ->where('modulo', 'tenants')
            ->where('record_id', $tenantId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'type_contact_id', 'value', 'order', 'active']);
    }

    public function store(Request $request, int $tenantId)
    {
        $validated = $request->validate([
            'type_contact_id' => ['required', 'integer', 'exists:type_contacts,id'],
            'value'           => ['required', 'string', 'max:255'],
        ]);

        $maxOrder = Contact::where('modulo', 'tenants')->where('record_id', $tenantId)->max('order') ?? 0;

        $contact = Contact::create([
            'modulo'    => 'tenants',
            'record_id' => $tenantId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $contact->load('typeContact:id,name,mask');

        return response()->json($contact, 201);
    }

    public function update(Request $request, int $tenantId, int $id)
    {
        $contact = Contact::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'type_contact_id' => ['sometimes', 'integer', 'exists:type_contacts,id'],
            'value'           => ['sometimes', 'string', 'max:255'],
            'active'          => ['boolean'],
        ]);

        $contact->update($validated);
        $contact->load('typeContact:id,name,mask');

        return response()->json($contact);
    }

    public function destroy(int $tenantId, int $id)
    {
        $contact = Contact::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);
        $contact->delete();

        return response()->json(null, 204);
    }
}
