<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gender extends Model
{
    protected $connection = 'pgsql_maps';
    protected $table = 'maps.genders';

    protected $fillable = ['description'];

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }
}
