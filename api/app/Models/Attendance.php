<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.attendances';

    protected $fillable = [
        'people_id',
        'title',
        'description',
        'address',
        'lat',
        'lng',
        'status',
        'priority',
        'opened_at',
        'resolved_at',
        'order',
    ];

    protected $casts = [
        'lat'         => 'float',
        'lng'         => 'float',
        'opened_at'   => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(AttendanceHistory::class, 'attendance_id');
    }

    public function attendancePeople(): HasMany
    {
        return $this->hasMany(AttendancePeople::class, 'attendance_id');
    }
}
