<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinPaymentMethodType extends Model
{
    protected $table = 'fin_payment_method_types';

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
        static::creating(function (FinPaymentMethodType $model) {
            if (empty($model->order)) {
                $model->order = (static::max('order') ?? 0) + 1;
            }
        });
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(FinPaymentMethod::class, 'fin_payment_method_type_id');
    }
}
