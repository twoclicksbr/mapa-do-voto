<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Address extends Model
{
    use SoftDeletes;

    protected $table = 'gabinete_master.addresses';

    protected $fillable = [
        'modulo',
        'record_id',
        'type_address_id',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'cidade',
        'uf',
        'ibge',
        'lat',
        'lng',
        'order',
        'active',
    ];

    public function typeAddress(): BelongsTo
    {
        return $this->belongsTo(TypeAddress::class, 'type_address_id');
    }
}
