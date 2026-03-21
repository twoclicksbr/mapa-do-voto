<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class TypeDocument extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.type_documents';

    protected $fillable = [
        'name',
        'mask',
        'validity',
        'order',
        'active',
    ];

    protected $casts = [
        'validity' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (TypeDocument $typeDocument) {
            if (empty($typeDocument->order)) {
                $typeDocument->order = (static::max('order') ?? 0) + 1;
            } else {
                static::shiftOrder($typeDocument->order);
            }
        });

        static::updating(function (TypeDocument $typeDocument) {
            if ($typeDocument->isDirty('order')) {
                static::shiftOrder($typeDocument->order, $typeDocument->id);
            }
        });
    }

    private static function shiftOrder(int $order, ?int $excludeId = null): void
    {
        $exists = static::where('order', $order)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            DB::table('gabinete_master.type_documents')
                ->where('order', '>=', $order)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->increment('order');
        }
    }
}
