<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AttendanceAddressController extends Controller
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

    public function index(int $attendanceId)
    {
        return Address::with('typeAddress:id,name')
            ->where('modulo', 'attendances')
            ->where('record_id', $attendanceId)
            ->orderBy('order')
            ->orderBy('id')
            ->get($this->fields);
    }

    public function store(Request $request, int $attendanceId)
    {
        $validated = $request->validate($this->rules);

        $maxOrder = Address::where('modulo', 'attendances')->where('record_id', $attendanceId)->max('order') ?? 0;

        $address = Address::create([
            'modulo'    => 'attendances',
            'record_id' => $attendanceId,
            'order'     => $maxOrder + 1,
            'active'    => true,
            ...$validated,
        ]);

        $address->load('typeAddress:id,name');

        return response()->json($address, 201);
    }

    public function update(Request $request, int $attendanceId, int $id)
    {
        $address = Address::where('modulo', 'attendances')->where('record_id', $attendanceId)->findOrFail($id);

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

    public function destroy(int $attendanceId, int $id)
    {
        $address = Address::where('modulo', 'attendances')->where('record_id', $attendanceId)->findOrFail($id);
        $address->delete();

        return response()->json(null, 204);
    }
}
