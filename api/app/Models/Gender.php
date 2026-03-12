<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gender extends Model
{
    protected $fillable = ['description'];

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }
}
