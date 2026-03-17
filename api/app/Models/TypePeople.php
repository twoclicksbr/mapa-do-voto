<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class TypePeople extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.type_people';

    protected $fillable = [
        'name',
        'order',
        'active',
    ];

    protected static function booted(): void
    {
        static::creating(function (TypePeople $typePeople) {
            if (empty($typePeople->order)) {
                $typePeople->order = (static::max('order') ?? 0) + 1;
            } else {
                static::shiftOrder($typePeople->order);
            }
        });

        static::updating(function (TypePeople $typePeople) {
            if ($typePeople->isDirty('order')) {
                static::shiftOrder($typePeople->order, $typePeople->id);
            }
        });
    }

    private static function shiftOrder(int $order, ?int $excludeId = null): void
    {
        $exists = static::where('order', $order)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();

        if ($exists) {
            DB::table('gabinete_master.type_people')
                ->where('order', '>=', $order)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->increment('order');
        }
    }

    public function people(): HasMany
    {
        return $this->hasMany(People::class, 'type_people_id');
    }
}
