<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.notes';

    protected $fillable = [
        'modulo',
        'record_id',
        'value',
        'order',
        'active',
    ];
}
