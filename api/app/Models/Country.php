<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $connection = 'pgsql_maps';
    protected $table = 'maps.countries';

    protected $fillable = ['name', 'geometry'];

    public function states(): HasMany
    {
        return $this->hasMany(State::class);
    }

    public function candidacies(): HasMany
    {
        return $this->hasMany(Candidacy::class);
    }
}
