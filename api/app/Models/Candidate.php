<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    protected $table = 'maps.candidates';

    protected $fillable = [
        'gender_id',
        'name',
        'cpf',
        'photo_url',
    ];

    public function gender(): BelongsTo
    {
        return $this->belongsTo(Gender::class);
    }

    public function candidacies(): HasMany
    {
        return $this->hasMany(Candidacy::class);
    }
}
