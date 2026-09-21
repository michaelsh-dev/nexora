<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashBank extends Model
{
    protected $fillable = [
        'code',
        'name',
        'type',
        'opening_balance',
        'status',
        'description',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
    ];

    public function receipts(): HasMany
    {
        return $this->hasMany(
            Receipt::class
        );
    }
}
