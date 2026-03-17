<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class TypeContact extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.type_contacts';

    protected $fillable = [
        'name',
        'mask',
        'order',
        'active',
    ];

    protected static function booted(): void
    {
        static::creating(function (TypeContact $typeContact) {
            if (empty($typeContact->order)) {
                $typeContact->order = (static::max('order') ?? 0) + 1;
            } else {
                static::shiftOrder($typeContact->order);
            }
        });

        static::updating(function (TypeContact $typeContact) {
            if ($typeContact->isDirty('order')) {
                static::shiftOrder($typeContact->order, $typeContact->id);
            }
        });
    }

    private static function shiftOrder(int $order, ?int $excludeId = null): void
    {
        $exists = static::where('order', $order)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            DB::table('gabinete_master.type_contacts')
                ->where('order', '>=', $order)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->increment('order');
        }
    }
}
