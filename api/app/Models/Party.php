<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Party extends Model
{
    protected $fillable = [
        'name',
        'abbreviation',
        'color_bg',
        'color_text',
        'color_gradient',
    ];
}
