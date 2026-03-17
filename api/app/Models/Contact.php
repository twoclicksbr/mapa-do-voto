<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.contacts';

    protected $fillable = [
        'modulo',
        'record_id',
        'type_contact_id',
        'value',
        'order',
        'active',
    ];

    public function typeContact(): BelongsTo
    {
        return $this->belongsTo(TypeContact::class, 'type_contact_id');
    }
}
