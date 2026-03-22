<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinExtract extends Model
{
    protected $table = 'fin_extract';

    protected $fillable = [
        'title_id',
        'account_id',
        'type',
        'amount',
        'date',
        'payment_method_id',
        'bank_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];

    public function title(): BelongsTo
    {
        return $this->belongsTo(FinTitle::class, 'title_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(FinAccount::class, 'account_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(FinPaymentMethod::class, 'payment_method_id');
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(FinBank::class, 'bank_id');
    }
}
