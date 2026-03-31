<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class TenantAddressController extends Controller
{
    private array $fields = ['id', 'type_address_id', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'ibge', 'lat', 'lng', 'order', 'active'];

    private array $rules = [
        'type_address_id' => ['required', 'integer', 'exists:type_addresses,id'],
        'cep'             => ['nullable', 'string', 'max:9'],
        'logradouro'      => ['nullable', 'string', 'max:255'],
        'numero'          => ['nullable', 'string', 'max:20'],
        'complemento'     => ['nullable', 'string', 'max:255'],
        'bairro'          => ['nullable', 'string', 'max:255'],
        'cidade'          => ['nullable', 'string', 'max:255'],
        'uf'              => ['nullable', 'string', 'size:2'],
        'ibge'            => ['nullable', 'string', 'max:7'],
        'lat'             => ['nullable', 'numeric'],
        'lng'             => ['nullable', 'numeric'],
    ];

    public function index(int $tenantId)
    {
        return Address::with('typeAddress:id,name')
            ->where('modulo', 'tenants')
            ->where('record_id', $tenantId)
            ->orderBy('order')
            ->orderBy('id')
            ->get($this->fields);
    }

    public function store(Request $request, int $tenantId)
    {
        $validated = $request->validate($this->rules);

        $maxOrder = Address::where('modulo', 'tenants')->where('record_id', $tenantId)->max('order') ?? 0;

        $address = Address::create([
            'modulo'    => 'tenants',
            'record_id' => $tenantId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $address->load('typeAddress:id,name');

        return response()->json($address, 201);
    }

    public function update(Request $request, int $tenantId, int $id)
    {
        $address = Address::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);

        $updateRules = array_map(
            fn($rule) => array_map(fn($r) => $r === 'required' ? 'sometimes' : $r, $rule),
            $this->rules
        );

        $validated = $request->validate(array_merge($updateRules, [
            'active' => ['boolean'],
        ]));

        $address->update($validated);
        $address->load('typeAddress:id,name');

        return response()->json($address);
    }

    public function destroy(int $tenantId, int $id)
    {
        $address = Address::where('modulo', 'tenants')->where('record_id', $tenantId)->findOrFail($id);
        $address->delete();

        return response()->json(null, 204);
    }
}
