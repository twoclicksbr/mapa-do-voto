<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    protected $connection = 'pgsql_maps';
    protected $table = 'maps.zones';

    protected $fillable = ['city_id', 'zone_number', 'geometry'];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }
}
