<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permission extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.permissions';

    protected $fillable = ['people_id', 'permission_action_id', 'allowed'];

    protected $casts = ['allowed' => 'boolean'];

    public function permissionAction()
    {
        return $this->belongsTo(PermissionAction::class);
    }
}
