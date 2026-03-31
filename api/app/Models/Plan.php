<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Plan extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.plans';

    protected $fillable = [
        'name',
        'description',
        'price_month',
        'price_yearly',
        'price_setup',
        'max_users',
        'has_schema',
        'recommended',
        'order',
        'active',
    ];

    protected $casts = [
        'price_month'  => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'price_setup'  => 'decimal:2',
        'has_schema'    => 'boolean',
        'recommended'   => 'boolean',
        'active'        => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Plan $plan) {
            if (empty($plan->order)) {
                $plan->order = (static::max('order') ?? 0) + 1;
            } else {
                static::shiftOrder($plan->order);
            }
        });

        static::updating(function (Plan $plan) {
            if ($plan->isDirty('order')) {
                static::shiftOrder($plan->order, $plan->id);
            }
        });
    }

    private static function shiftOrder(int $order, ?int $excludeId = null): void
    {
        $exists = static::where('order', $order)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            DB::table('gabinete_master.plans')
                ->where('order', '>=', $order)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->increment('order');
        }
    }
}
