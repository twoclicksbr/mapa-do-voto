<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceHistory;
use App\Models\AttendancePeople;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with(['people', 'attendancePeople.people'])
            ->orderBy('order')
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $statuses = is_array($request->status) ? $request->status : explode(',', $request->status);
            $query->whereIn('status', $statuses);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('people_id')) {
            $query->where('people_id', $request->people_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('opened_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('opened_at', '<=', $request->date_to);
        }

        return response()->json($query->get()->map(fn ($a) => $this->format($a)));
    }

    public function show(int $id)
    {
        $attendance = Attendance::with(['people', 'history', 'attendancePeople.people'])->findOrFail($id);

        return response()->json($this->formatDetail($attendance));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'people_id'   => ['nullable', 'integer'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address'     => ['nullable', 'string', 'max:500'],
            'lat'         => ['nullable', 'numeric'],
            'lng'         => ['nullable', 'numeric'],
            'status'      => ['sometimes', 'in:aberto,em_andamento,resolvido'],
            'priority'    => ['sometimes', 'in:alta,media,baixa'],
        ]);

        $data['opened_at'] = now();
        $data['status']    = $data['status'] ?? 'aberto';
        $data['priority']  = $data['priority'] ?? 'media';

        $attendance = Attendance::create($data);

        AttendanceHistory::create([
            'attendance_id' => $attendance->id,
            'status'        => $attendance->status,
            'notes'         => 'Atendimento aberto.',
        ]);

        $attendance->load(['people', 'attendancePeople.people']);

        return response()->json($this->format($attendance), 201);
    }

    public function update(Request $request, int $id)
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'people_id'   => ['sometimes', 'integer'],
            'title'       => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address'     => ['nullable', 'string', 'max:500'],
            'lat'         => ['nullable', 'numeric'],
            'lng'         => ['nullable', 'numeric'],
            'status'      => ['sometimes', 'in:aberto,em_andamento,resolvido'],
            'priority'    => ['sometimes', 'in:alta,media,baixa'],
            'notes'       => ['nullable', 'string'],
        ]);

        $oldStatus = $attendance->status;
        $newStatus = $data['status'] ?? $oldStatus;

        if ($newStatus === 'resolvido' && $oldStatus !== 'resolvido') {
            $data['resolved_at'] = now();
        } elseif ($newStatus !== 'resolvido' && $oldStatus === 'resolvido') {
            $data['resolved_at'] = null;
        }

        $attendance->update(collect($data)->except('notes')->toArray());

        if ($newStatus !== $oldStatus) {
            AttendanceHistory::create([
                'attendance_id' => $attendance->id,
                'status'        => $newStatus,
                'notes'         => $data['notes'] ?? null,
            ]);
        }

        $attendance->load(['people', 'attendancePeople.people']);

        return response()->json($this->format($attendance));
    }

    public function reorder(Request $request)
    {
        $items = $request->validate(['items' => ['required', 'array'], 'items.*.id' => ['required', 'integer'], 'items.*.order' => ['required', 'integer']])['items'];

        foreach ($items as $item) {
            Attendance::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(null, 204);
    }

    public function destroy(int $id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json(null, 204);
    }

    // ─── People pivot ──────────────────────────────────────────────────────────

    public function peopleIndex(int $id)
    {
        $attendance = Attendance::findOrFail($id);

        return response()->json(
            $attendance->attendancePeople()->with('people')->get()->map(fn ($ap) => $this->formatAttendancePerson($ap))
        );
    }

    public function peopleStore(Request $request, int $id)
    {
        $attendance = Attendance::findOrFail($id);

        $request->validate([
            'people_id' => ['required', 'integer'],
        ]);

        $existing = $attendance->attendancePeople()->withTrashed()->where('people_id', $request->people_id)->first();
        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
                $existing->update(['active' => true]);
            }
            $existing->load('people');
            return response()->json($this->formatAttendancePerson($existing));
        }

        $ap = $attendance->attendancePeople()->create([
            'people_id' => $request->people_id,
            'active'    => true,
        ]);

        $ap->load('people');

        return response()->json($this->formatAttendancePerson($ap), 201);
    }

    public function peopleDestroy(int $id, int $pid)
    {
        $ap = AttendancePeople::where('attendance_id', $id)->where('people_id', $pid)->firstOrFail();
        $ap->delete();

        return response()->json(null, 204);
    }

    // ─── History ───────────────────────────────────────────────────────────────

    public function historyIndex(int $id)
    {
        $attendance = Attendance::findOrFail($id);

        return response()->json(
            $attendance->history()->orderBy('created_at')->get()->map(fn ($h) => [
                'id'            => $h->id,
                'attendance_id' => $h->attendance_id,
                'status'        => $h->status,
                'notes'         => $h->notes,
                'created_at'    => $h->created_at?->toIso8601String(),
            ])
        );
    }

    public function historyStore(Request $request, int $id)
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'in:aberto,em_andamento,resolvido'],
            'notes'  => ['nullable', 'string'],
        ]);

        $h = AttendanceHistory::create([
            'attendance_id' => $attendance->id,
            'status'        => $data['status'],
            'notes'         => $data['notes'] ?? null,
        ]);

        return response()->json([
            'id'            => $h->id,
            'attendance_id' => $h->attendance_id,
            'status'        => $h->status,
            'notes'         => $h->notes,
            'created_at'    => $h->created_at?->toIso8601String(),
        ], 201);
    }

    // ─── Format ────────────────────────────────────────────────────────────────

    private function format(Attendance $a): array
    {
        $photoPath = $a->people?->photo_path;

        return [
            'id'          => $a->id,
            'people_id'   => $a->people_id,
            'people_name' => $a->people?->name,
            'people_photo_sm' => $photoPath ? url("storage/{$photoPath}/sm.jpg") : null,
            'title'       => $a->title,
            'description' => $a->description,
            'address'     => $a->address,
            'lat'         => $a->lat,
            'lng'         => $a->lng,
            'status'      => $a->status,
            'priority'    => $a->priority,
            'order'       => $a->order,
            'opened_at'   => $a->opened_at?->toIso8601String(),
            'resolved_at' => $a->resolved_at?->toIso8601String(),
            'created_at'  => $a->created_at?->toIso8601String(),
            'updated_at'  => $a->updated_at?->toIso8601String(),
            'people'      => $a->attendancePeople->map(fn ($ap) => $this->formatAttendancePerson($ap))->values(),
        ];
    }

    private function formatDetail(Attendance $a): array
    {
        $base    = $this->format($a);
        $history = $a->history->sortBy('created_at')->map(fn ($h) => [
            'id'         => $h->id,
            'status'     => $h->status,
            'notes'      => $h->notes,
            'created_at' => $h->created_at?->toIso8601String(),
        ])->values();

        return array_merge($base, ['history' => $history]);
    }

    private function formatAttendancePerson(AttendancePeople $ap): array
    {
        $photoPath = $ap->people?->photo_path;

        return [
            'id'         => $ap->id,
            'people_id'  => $ap->people_id,
            'name'       => $ap->people?->name,
            'photo_sm'   => $photoPath ? url("storage/{$photoPath}/sm.jpg") : null,
            'active'     => $ap->active,
        ];
    }
}
