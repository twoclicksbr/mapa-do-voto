<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.tenants';

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'name',
        'slug',
        'schema',
        'has_schema',
        'active',
        'valid_until',
        'logo_path',
    ];

    protected $casts = [
        'has_schema'  => 'boolean',
        'active'      => 'boolean',
        'valid_until' => 'date',
    ];

    public function parent()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function children()
    {
        return $this->hasMany(Tenant::class, 'tenant_id');
    }
}
