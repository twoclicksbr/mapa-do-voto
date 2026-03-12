<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeopleCandidacy extends Model
{
    protected $fillable = [
        'people_id',
        'candidacy_id',
        'order',
        'active',
    ];

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class);
    }

    public function candidacy(): BelongsTo
    {
        return $this->belongsTo(Candidacy::class);
    }

    public function splitCandidacies(): HasMany
    {
        return $this->hasMany(SplitCandidacy::class);
    }
}
