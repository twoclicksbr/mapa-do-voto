<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    protected $fillable = [
        'candidacy_id',
        'country_id',
        'state_id',
        'city_id',
        'zone_id',
        'section_id',
        'voting_location_id',
        'year',
        'round',
        'qty_votes',
    ];

    public function candidacy(): BelongsTo
    {
        return $this->belongsTo(Candidacy::class);
    }

    public function votingLocation(): BelongsTo
    {
        return $this->belongsTo(VotingLocation::class);
    }
}
