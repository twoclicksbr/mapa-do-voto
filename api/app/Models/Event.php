<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.events';

    protected $fillable = [
        'people_id',
        'event_type_id',
        'modulo',
        'name',
        'description',
        'start_at',
        'end_at',
        'gcal_event_id',
        'active',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at'   => 'datetime',
        'active'   => 'boolean',
    ];

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class, 'event_type_id');
    }

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }

    public function eventPeople(): HasMany
    {
        return $this->hasMany(EventPeople::class, 'event_id');
    }
}
