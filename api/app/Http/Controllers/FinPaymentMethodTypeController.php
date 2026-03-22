<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinPaymentMethodTypeRequest;
use App\Models\FinPaymentMethodType;
use Illuminate\Http\Request;

class FinPaymentMethodTypeController extends Controller
{
    public function index()
    {
        return response()->json(
            FinPaymentMethodType::orderBy('order')->get(['id', 'name', 'order'])
        );
    }

    public function store(FinPaymentMethodTypeRequest $request)
    {
        $type = FinPaymentMethodType::create($request->validated());

        return response()->json($this->format($type), 201);
    }

    public function update(FinPaymentMethodTypeRequest $request, int $id)
    {
        $type = FinPaymentMethodType::findOrFail($id);
        $type->update($request->validated());

        return response()->json($this->format($type));
    }

    public function reorder(Request $request)
    {
        $items = $request->validate([
            '*.id'    => ['required', 'integer'],
            '*.order' => ['required', 'integer', 'min:1'],
        ]);

        foreach ($items as $item) {
            FinPaymentMethodType::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(null, 204);
    }

    public function destroy(int $id)
    {
        FinPaymentMethodType::findOrFail($id)->delete();

        return response()->json(null, 204);
    }

    private function format(FinPaymentMethodType $type): array
    {
        return [
            'id'    => $type->id,
            'name'  => $type->name,
            'order' => $type->order,
        ];
    }
}
