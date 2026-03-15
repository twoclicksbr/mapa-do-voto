<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SplitCandidacy extends Model
{
    protected $table = 'gabinete_clickmaps.split_candidacies';

    protected $fillable = [
        'people_candidacy_id',
        'candidacy_id',
        'order',
        'active',
    ];

    public function peopleCandidacy(): BelongsTo
    {
        return $this->belongsTo(PeopleCandidacy::class);
    }

    public function candidacy(): BelongsTo
    {
        return $this->belongsTo(Candidacy::class);
    }
}
