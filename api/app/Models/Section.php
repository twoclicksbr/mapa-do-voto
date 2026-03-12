<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Section extends Model
{
    protected $fillable = ['voting_location_id', 'section_number'];

    public function votingLocation(): BelongsTo
    {
        return $this->belongsTo(VotingLocation::class);
    }
}
