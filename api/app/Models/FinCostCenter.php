<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinCostCenter extends Model
{
    protected $table = 'fin_cost_centers';

    protected $fillable = [
        'title_id',
        'department_id',
        'percentage',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
    ];

    public function title(): BelongsTo
    {
        return $this->belongsTo(FinTitle::class, 'title_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
