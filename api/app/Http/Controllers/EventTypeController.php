<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventTypeRequest;
use App\Models\EventType;

class EventTypeController extends Controller
{
    public function index()
    {
        $eventTypes = EventType::orderBy('order')->get(['id', 'name', 'color', 'order', 'active']);

        return response()->json($eventTypes);
    }

    public function store(EventTypeRequest $request)
    {
        $eventType = EventType::create($request->validated());

        return response()->json($this->format($eventType), 201);
    }

    public function update(EventTypeRequest $request, int $id)
    {
        $eventType = EventType::findOrFail($id);
        $eventType->update($request->validated());

        return response()->json($this->format($eventType));
    }

    public function destroy(int $id)
    {
        $eventType = EventType::findOrFail($id);
        $eventType->delete();

        return response()->json(null, 204);
    }

    private function format(EventType $eventType): array
    {
        return [
            'id'     => $eventType->id,
            'name'   => $eventType->name,
            'color'  => $eventType->color,
            'order'  => $eventType->order,
            'active' => $eventType->active,
        ];
    }
}
