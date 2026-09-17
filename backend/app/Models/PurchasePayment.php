<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchasePayment extends Model
{
    protected $fillable = [
        'number',
        'date',
        'purchase_invoice_id',
        'amount',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function purchaseInvoice(): BelongsTo
    {
        return $this->belongsTo(
            PurchaseInvoice::class
        );
    }
}