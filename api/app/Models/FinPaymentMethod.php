<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinPaymentMethod extends Model
{
    use SoftDeletes;

    protected $table = 'fin_payment_methods';

    protected $fillable = [
        'name',
        'fin_bank_id',
        'fin_payment_method_type_id',
        'order',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (FinPaymentMethod $model) {
            if (empty($model->order)) {
                $model->order = (static::max('order') ?? 0) + 1;
            }
        });
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(FinBank::class, 'fin_bank_id');
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(FinPaymentMethodType::class, 'fin_payment_method_type_id');
    }
}
