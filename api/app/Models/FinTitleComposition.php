<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinTitleComposition extends Model
{
    protected $table = 'fin_title_compositions';

    protected $fillable = [
        'origin_title_id',
        'destination_title_id',
    ];

    public function originTitle(): BelongsTo
    {
        return $this->belongsTo(FinTitle::class, 'origin_title_id');
    }

    public function destinationTitle(): BelongsTo
    {
        return $this->belongsTo(FinTitle::class, 'destination_title_id');
    }
}
