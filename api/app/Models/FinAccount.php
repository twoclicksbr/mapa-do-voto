<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinAccount extends Model
{
    use SoftDeletes;

    protected $table = 'fin_accounts';

    protected $fillable = [
        'parent_id',
        'code',
        'name',
        'description',
        'type',
        'nature',
        'order',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (FinAccount $model) {
            if (empty($model->order)) {
                $model->order = (static::max('order') ?? 0) + 1;
            }
        });
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(FinAccount::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(FinAccount::class, 'parent_id');
    }

    public function titles(): HasMany
    {
        return $this->hasMany(FinTitle::class, 'account_id');
    }
}
