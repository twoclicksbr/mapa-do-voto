<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class People extends Model
{
    protected $table = 'gabinete_master.people';

    protected $fillable = [
        'name',
        'avatar_url',
        'active',
        'role',
    ];

    public function peopleCandidacies(): HasMany
    {
        return $this->hasMany(PeopleCandidacy::class);
    }
}
