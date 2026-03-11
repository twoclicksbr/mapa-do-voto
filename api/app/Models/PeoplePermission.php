<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeoplePermission extends Model
{
    protected $fillable = [
        'people_id',
        'permission',
    ];

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class);
    }
}
