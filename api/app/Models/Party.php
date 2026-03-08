<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Party extends Model
{
    use SoftDeletes;

    protected $fillable = ['uuid', 'name', 'abbreviation', 'active'];

    protected static function booted(): void
    {
        static::creating(function (Party $party) {
            $party->uuid ??= Str::uuid()->toString();
        });
    }
}
