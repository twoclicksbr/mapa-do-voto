<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinPaymentMethodRequest;
use App\Models\FinPaymentMethod;
use App\Models\FinPaymentMethodType;

class FinPaymentMethodController extends Controller
{
    public function types()
    {
        return response()->json(
            FinPaymentMethodType::orderBy('name')->get(['id', 'name'])
        );
    }

    public function index()
    {
        $methods = FinPaymentMethod::with('bank', 'type')
            ->orderBy('order')
            ->get();

        return response()->json($methods->map(fn ($m) => $this->format($m)));
    }

    public function store(FinPaymentMethodRequest $request)
    {
        $method = FinPaymentMethod::create($request->validated());
        $method->load('bank', 'type');

        return response()->json($this->format($method), 201);
    }

    public function update(FinPaymentMethodRequest $request, int $id)
    {
        $method = FinPaymentMethod::findOrFail($id);
        $method->update($request->validated());
        $method->load('bank', 'type');

        return response()->json($this->format($method));
    }

    public function destroy(int $id)
    {
        $method = FinPaymentMethod::findOrFail($id);
        $method->delete();

        return response()->json(null, 204);
    }

    private function format(FinPaymentMethod $method): array
    {
        return [
            'id'                         => $method->id,
            'name'                       => $method->name,
            'fin_bank_id'                => $method->fin_bank_id,
            'bank_name'                  => $method->bank?->name,
            'fin_payment_method_type_id' => $method->fin_payment_method_type_id,
            'type_name'                  => $method->type?->name,
            'order'                      => $method->order,
            'active'                     => $method->active,
        ];
    }
}
