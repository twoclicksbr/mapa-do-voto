<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinTitle extends Model
{
    use SoftDeletes;

    protected $table = 'fin_titles';

    protected $fillable = [
        'type',
        'description',
        'amount',
        'discount',
        'interest',
        'due_date',
        'paid_at',
        'amount_paid',
        'installment_number',
        'installment_total',
        'account_id',
        'payment_method_id',
        'bank_id',
        'people_id',
        'document_number',
        'invoice_number',
        'barcode',
        'pix_key',
        'status',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'discount'     => 'decimal:2',
        'interest'     => 'decimal:2',
        'amount_paid'  => 'decimal:2',
        'due_date'     => 'date:Y-m-d',
        'paid_at'      => 'date:Y-m-d',
    ];

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

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }

    public function costCenters(): HasMany
    {
        return $this->hasMany(FinCostCenter::class, 'title_id');
    }

    public function extract(): HasMany
    {
        return $this->hasMany(FinExtract::class, 'title_id');
    }

    public function originCompositions(): HasMany
    {
        return $this->hasMany(FinTitleComposition::class, 'origin_title_id');
    }

    public function destinationCompositions(): HasMany
    {
        return $this->hasMany(FinTitleComposition::class, 'destination_title_id');
    }
}
