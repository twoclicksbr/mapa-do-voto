<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['eventType', 'people', 'eventPeople'])
            ->orderBy('start_at')
            ->orderBy('id');

        if ($request->filled('people_id')) {
            $query->where('people_id', $request->people_id);
        }

        if ($request->filled('event_type_id')) {
            $query->where('event_type_id', $request->event_type_id);
        }

        if ($request->filled('modulo')) {
            $query->where('modulo', $request->modulo);
        }

        if ($request->filled('start_from')) {
            $query->where('start_at', '>=', $request->start_from);
        }

        if ($request->filled('start_to')) {
            $query->where('start_at', '<=', $request->start_to);
        }

        $events = $query->get();

        return response()->json($events->map(fn ($e) => $this->format($e)));
    }

    public function show(int $id)
    {
        $event = Event::with(['eventType', 'people', 'eventPeople'])->findOrFail($id);

        return response()->json($this->format($event));
    }

    public function store(EventRequest $request)
    {
        $event = Event::create($request->validated());
        $event->load(['eventType', 'people', 'eventPeople']);

        return response()->json($this->format($event), 201);
    }

    public function update(EventRequest $request, int $id)
    {
        $event = Event::findOrFail($id);
        $event->update($request->validated());
        $event->load(['eventType', 'people', 'eventPeople']);

        return response()->json($this->format($event));
    }

    public function destroy(int $id)
    {
        $event = Event::findOrFail($id);
        $event->delete();

        return response()->json(null, 204);
    }

    private function format(Event $event): array
    {
        return [
            'id'            => $event->id,
            'people_id'     => $event->people_id,
            'people_name'   => $event->people?->name,
            'event_type_id' => $event->event_type_id,
            'event_type'    => $event->eventType ? [
                'id'    => $event->eventType->id,
                'name'  => $event->eventType->name,
                'color' => $event->eventType->color,
            ] : null,
            'modulo'        => $event->modulo,
            'name'          => $event->name,
            'description'   => $event->description,
            'start_at'      => $event->start_at?->toIso8601String(),
            'end_at'        => $event->end_at?->toIso8601String(),
            'gcal_event_id' => $event->gcal_event_id,
            'active'        => $event->active,
            'people'        => $event->eventPeople->map(fn ($ep) => [
                'id'        => $ep->id,
                'people_id' => $ep->people_id,
                'active'    => $ep->active,
            ])->values(),
        ];
    }
}
