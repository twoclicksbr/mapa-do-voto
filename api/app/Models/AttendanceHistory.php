<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceHistory extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.attendance_history';

    protected $fillable = [
        'attendance_id',
        'status',
        'notes',
    ];

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class, 'attendance_id');
    }
}
