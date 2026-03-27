<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class EventType extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.event_types';

    protected $fillable = [
        'name',
        'color',
        'order',
        'active',
    ];

    protected static function booted(): void
    {
        static::creating(function (EventType $eventType) {
            if (empty($eventType->order)) {
                $eventType->order = (static::max('order') ?? 0) + 1;
            } else {
                static::shiftOrder($eventType->order);
            }
        });

        static::updating(function (EventType $eventType) {
            if ($eventType->isDirty('order')) {
                static::shiftOrder($eventType->order, $eventType->id);
            }
        });
    }

    private static function shiftOrder(int $order, ?int $excludeId = null): void
    {
        $exists = static::where('order', $order)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            DB::table('gabinete_master.event_types')
                ->where('order', '>=', $order)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->increment('order');
        }
    }
}
