<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PermissionAction extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.permission_actions';

    protected $fillable = ['module', 'action', 'description'];
}
