<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Candidate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid', 'sq_candidato', 'party_id', 'name', 'ballot_name', 'role',
        'number', 'nr_candidato', 'year', 'state', 'city_ibge_code',
        'cd_municipio', 'avatar_url', 'status', 'active',
    ];

    protected static function booted(): void
    {
        static::creating(function (Candidate $candidate) {
            $candidate->uuid ??= Str::uuid()->toString();
        });
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }
}
