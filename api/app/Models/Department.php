<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use SoftDeletes;

    protected $table = 'departments';

    protected $fillable = [
        'name',
        'order',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Department $model) {
            if (empty($model->order)) {
                $model->order = (static::max('order') ?? 0) + 1;
            }
        });
    }

    public function costCenters(): HasMany
    {
        return $this->hasMany(FinCostCenter::class, 'department_id');
    }
}
