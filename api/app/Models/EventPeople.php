<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventPeople extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.event_people';

    protected $fillable = [
        'event_id',
        'people_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function people(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }
}
