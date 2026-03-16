<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.tenants';

    protected $fillable = [
        'name',
        'slug',
        'schema',
        'active',
        'valid_until',
    ];

    protected $casts = [
        'active'      => 'boolean',
        'valid_until' => 'date',
    ];
}
