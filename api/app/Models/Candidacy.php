<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidacy extends Model
{
    protected $table = 'maps.candidacies';

    protected $fillable = [
        'sq_candidato',
        'candidate_id',
        'party_id',
        'country_id',
        'state_id',
        'city_id',
        'year',
        'role',
        'ballot_name',
        'number',
        'status',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
