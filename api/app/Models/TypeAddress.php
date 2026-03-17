<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class TypeAddress extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.type_addresses';

    protected $fillable = [
        'name',
        'order',
        'active',
    ];

    protected static function booted(): void
    {
        static::creating(function (TypeAddress $typeAddress) {
            if (empty($typeAddress->order)) {
                $typeAddress->order = (static::max('order') ?? 0) + 1;
            } else {
                static::shiftOrder($typeAddress->order);
            }
        });

        static::updating(function (TypeAddress $typeAddress) {
            if ($typeAddress->isDirty('order')) {
                static::shiftOrder($typeAddress->order, $typeAddress->id);
            }
        });
    }

    private static function shiftOrder(int $order, ?int $excludeId = null): void
    {
        $exists = static::where('order', $order)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            DB::table('gabinete_master.type_addresses')
                ->where('order', '>=', $order)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->increment('order');
        }
    }
}
