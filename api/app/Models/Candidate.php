<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Candidate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sq_candidato',
        'party_id',
        'position_id',
        'name',
        'ballot_name',
        'number',
        'year',
        'cd_municipio',
        'avatar_url',
        'status',
        'active',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }
}
