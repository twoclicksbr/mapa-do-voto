<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VotingLocation extends Model
{
    protected $fillable = [
        'zone_id',
        'tse_number',
        'name',
        'address',
        'latitude',
        'longitude',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
