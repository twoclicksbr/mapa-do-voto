<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Zone extends Model
{
    protected $fillable = ['city_id', 'code', 'geometry'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
