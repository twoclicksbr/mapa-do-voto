<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinBank extends Model
{
    use SoftDeletes;

    protected $table = 'fin_banks';

    protected $fillable = [
        'name',
        'bank',
        'agency',
        'account',
        'main',
        'order',
        'active',
    ];

    protected $casts = [
        'main'   => 'boolean',
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (FinBank $finBank) {
            if (empty($finBank->order)) {
                $finBank->order = (static::max('order') ?? 0) + 1;
            }
        });
    }
}
