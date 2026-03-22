<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinWallet extends Model
{
    protected $table = 'fin_wallets';

    protected $fillable = [
        'people_id',
        'balance',
        'title_id',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }

    public function title(): BelongsTo
    {
        return $this->belongsTo(FinTitle::class, 'title_id');
    }
}
