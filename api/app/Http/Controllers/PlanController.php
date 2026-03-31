<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlanRequest;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index()
    {
        $plans = Plan::orderBy('order')->get([
            'id', 'name', 'description', 'price_month', 'price_yearly', 'price_setup',
            'max_users', 'has_schema', 'recommended', 'order', 'active', 'created_at', 'updated_at',
        ]);

        return response()->json($plans);
    }

    public function store(PlanRequest $request)
    {
        $plan = Plan::create($request->validated());

        return response()->json($this->format($plan), 201);
    }

    public function update(PlanRequest $request, int $id)
    {
        $plan = Plan::findOrFail($id);
        $plan->update($request->validated());

        return response()->json($this->format($plan));
    }

    public function destroy(int $id)
    {
        $plan = Plan::findOrFail($id);
        $plan->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request)
    {
        $items = $request->validate(['items' => 'required|array', 'items.*.id' => 'required|integer', 'items.*.order' => 'required|integer']);

        foreach ($items['items'] as $item) {
            Plan::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(null, 204);
    }

    private function format(Plan $plan): array
    {
        return [
            'id'           => $plan->id,
            'name'         => $plan->name,
            'description'  => $plan->description,
            'price_month'  => $plan->price_month,
            'price_yearly' => $plan->price_yearly,
            'price_setup'  => $plan->price_setup,
            'max_users'    => $plan->max_users,
            'has_schema'   => $plan->has_schema,
            'recommended'  => $plan->recommended,
            'order'        => $plan->order,
            'active'       => $plan->active,
            'created_at'   => $plan->created_at,
            'updated_at'   => $plan->updated_at,
        ];
    }
}
