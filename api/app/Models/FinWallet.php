<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinWallet extends Model
{
    protected $table = 'fin_wallets';

    protected $fillable = [
        'people_id',
        'type',
        'amount',
        'date',
        'description',
        'title_id',
        'source',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }
}
