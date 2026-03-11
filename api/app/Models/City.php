<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    protected $fillable = ['state_id', 'name', 'ibge_code', 'tse_code', 'geometry'];

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }
}
