<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonFile extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.files';

    protected $fillable = [
        'modulo',
        'record_id',
        'name',
        'path',
        'mime_type',
        'size',
        'order',
        'active',
    ];
}
