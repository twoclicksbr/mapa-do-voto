<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class People extends Model
{
    protected $table = 'gabinete_master.people';

    protected $fillable = [
        'tenant_id',
        'type_people_id',
        'name',
        'birth_date',
        'photo_path',
        'active',
    ];

    protected $casts = [
        'birth_date' => 'date:Y-m-d',
    ];

    public function typePeople(): BelongsTo
    {
        return $this->belongsTo(TypePeople::class, 'type_people_id');
    }

    public function peopleCandidacies(): HasMany
    {
        return $this->hasMany(PeopleCandidacy::class);
    }
}
