<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinBankBalance extends Model
{
    protected $table = 'gabinete_master.fin_bank_balances';

    protected $fillable = ['fin_bank_id', 'data', 'valor'];

    protected $casts = [
        'data'  => 'date:Y-m-d',
        'valor' => 'decimal:2',
    ];

    public function bank()
    {
        return $this->belongsTo(FinBank::class, 'fin_bank_id');
    }
}
