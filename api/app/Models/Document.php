<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.documents';

    protected $fillable = [
        'modulo',
        'record_id',
        'type_document_id',
        'value',
        'validity',
        'order',
        'active',
    ];

    protected $casts = [
        'validity' => 'date',
    ];

    public function typeDocument(): BelongsTo
    {
        return $this->belongsTo(TypeDocument::class, 'type_document_id');
    }
}
