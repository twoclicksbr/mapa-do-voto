<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $startFrom = $request->filled('start_from') ? Carbon::parse($request->start_from) : null;
        $startTo   = $request->filled('start_to')   ? Carbon::parse($request->start_to)   : null;

        $query = Event::with(['eventType', 'people', 'eventPeople.people'])
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

        // Non-recurring events: apply date range filter directly.
        // Recurring events: fetch all and expand in PHP.
        $query->where(function ($q) use ($startFrom, $startTo) {
            $q->where(function ($inner) use ($startFrom, $startTo) {
                $inner->where(function ($r) {
                    $r->where('recurrence', 'none')->orWhereNull('recurrence');
                });
                if ($startFrom) $inner->where('start_at', '>=', $startFrom);
                if ($startTo)   $inner->where('start_at', '<=', $startTo);
            })->orWhere(function ($inner) {
                $inner->whereNotNull('recurrence')->whereNotIn('recurrence', ['none']);
            });
        });

        $events = $query->get();

        $result = [];
        foreach ($events as $event) {
            $isRecurring = $event->recurrence && $event->recurrence !== 'none';
            if ($isRecurring && $startFrom && $startTo) {
                foreach ($this->expandRecurring($event, $startFrom, $startTo) as $occ) {
                    $result[] = $occ;
                }
            } else {
                $result[] = $this->format($event);
            }
        }

        usort($result, fn ($a, $b) => strcmp($a['start_at'] ?? '', $b['start_at'] ?? ''));

        return response()->json($result);
    }

    private function expandRecurring(Event $event, Carbon $from, Carbon $to): array
    {
        $occurrences = [];
        $base        = $event->start_at; // Carbon (cast in model)
        $duration    = $event->end_at ? $base->diffInSeconds($event->end_at) : null;

        $cursor = match ($event->recurrence) {
            'yearly'  => $base->copy()->setYear($from->year),
            'monthly' => $base->copy()->setYear($from->year)->setMonth($from->month),
            'weekly'  => (function () use ($base, $from) {
                $diff   = ($base->dayOfWeek - $from->dayOfWeek + 7) % 7;
                $cursor = $from->copy()->addDays($diff)->setTime($base->hour, $base->minute, $base->second);
                return $cursor < $from ? $cursor->addWeek() : $cursor;
            })(),
            'daily'   => $from->copy()->setTime($base->hour, $base->minute, $base->second),
            default   => null,
        };

        if (!$cursor) return [];

        // Advance cursor to first occurrence on or after $from
        if (in_array($event->recurrence, ['yearly', 'monthly'])) {
            while ($cursor < $from) {
                $cursor = $event->recurrence === 'yearly'
                    ? $cursor->copy()->addYear()
                    : $cursor->copy()->addMonth();
            }
        }

        $index = 0;
        while ($cursor <= $to) {
            $formatted               = $this->format($event);
            $formatted['_fc_id']     = "{$event->id}_{$index}";
            $formatted['start_at']   = $cursor->toIso8601String();
            $formatted['end_at']     = $duration !== null
                ? $cursor->copy()->addSeconds($duration)->toIso8601String()
                : null;
            $occurrences[]           = $formatted;
            $index++;

            $cursor = match ($event->recurrence) {
                'yearly'  => $cursor->copy()->addYear(),
                'monthly' => $cursor->copy()->addMonth(),
                'weekly'  => $cursor->copy()->addWeek(),
                'daily'   => $cursor->copy()->addDay(),
                default   => null,
            };
            if (!$cursor) break;
        }

        return $occurrences;
    }

    public function show(int $id)
    {
        $event = Event::with(['eventType', 'people', 'eventPeople.people'])->findOrFail($id);

        return response()->json($this->format($event));
    }

    public function store(EventRequest $request)
    {
        $data  = collect($request->validated())->except('people_ids')->toArray();
        $event = Event::create($data);
        $this->syncPeople($event, $request->input('people_ids', []));
        $event->load(['eventType', 'people', 'eventPeople.people']);

        return response()->json($this->format($event), 201);
    }

    public function update(EventRequest $request, int $id)
    {
        $event = Event::findOrFail($id);
        $data  = collect($request->validated())->except('people_ids')->toArray();
        $event->update($data);
        $this->syncPeople($event, $request->input('people_ids', []));
        $event->load(['eventType', 'people', 'eventPeople.people']);

        return response()->json($this->format($event));
    }

    private function syncPeople(Event $event, array $peopleIds): void
    {
        $existing = $event->eventPeople()->pluck('people_id')->toArray();
        $toAdd    = array_diff($peopleIds, $existing);
        $toRemove = array_diff($existing, $peopleIds);

        foreach ($toAdd as $pid) {
            $event->eventPeople()->create(['people_id' => $pid, 'active' => true]);
        }

        if (!empty($toRemove)) {
            $event->eventPeople()->whereIn('people_id', $toRemove)->delete();
        }
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
            'all_day'       => (bool) $event->all_day,
            'recurrence'    => $event->recurrence ?? 'none',
            'gcal_event_id' => $event->gcal_event_id,
            'active'        => $event->active,
            'people'        => $event->eventPeople->map(fn ($ep) => [
                'id'        => $ep->id,
                'people_id' => $ep->people_id,
                'name'      => $ep->people?->name,
                'photo_sm'  => $ep->people?->photo_path
                    ? url("storage/{$ep->people->photo_path}/sm.jpg")
                    : null,
                'active'    => $ep->active,
            ])->values(),
        ];
    }
}
