<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class People extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'name',
        'avatar_url',
        'active',
    ];

    protected static function booted(): void
    {
        static::creating(function (People $people) {
            $people->uuid ??= Str::uuid()->toString();
        });
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(PeoplePermission::class);
    }

    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('permission', $permission)->exists();
    }
}
