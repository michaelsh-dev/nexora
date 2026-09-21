<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    protected $fillable = [
        'number',
        'date',
        'cash_bank_id',
        'source',
        'amount',
        'description',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function cashBank(): BelongsTo
    {
        return $this->belongsTo(
            CashBank::class
        );
    }
}