<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendancePeople extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.attendance_people';

    protected $fillable = [
        'attendance_id',
        'people_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function people(): BelongsTo
    {
        return $this->belongsTo(People::class, 'people_id');
    }
}
